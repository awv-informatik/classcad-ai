// PoC: run the PUBLISHED ClassCAD WASM (21.2.0, built with -sENVIRONMENT=web) inside Node,
// mimicking what ClassCADWasmWorker.js does in the browser. Key comes from env (never printed).
import { readFileSync } from 'node:fs'
import { inflateRawSync } from 'node:zlib'
import { pathToFileURL } from 'node:url'
const dir = new URL('.', import.meta.url).pathname
const key = process.env.CLASSCAD_WASM_KEY
if (!key) { console.log('no CLASSCAD_WASM_KEY in env'); process.exit(2) }
const origin = process.env.POC_ORIGIN ?? 'http://localhost:3000'
// The engine's license check compares globalThis.location.origin with the siteLocation
// passed to init() and the key's allowedOrigins - shim what a browser worker would have.
const loc = { href: origin + '/', origin, protocol: origin.split(':')[0] + ':', host: origin.replace(/^\w+:\/\//, ''), hostname: origin.replace(/^\w+:\/\//, '').split(':')[0], port: origin.split(':')[2] ?? '', pathname: '/', search: '', hash: '' }
globalThis.location = loc
// Minimal synchronous XMLHttpRequest shim: the web-built glue loads the side modules
// listed in the main module's dylink section through sync XHR. Serve them from disk.
const xhrLog = []
globalThis.XMLHttpRequest = class {
  open(method, url, async) { this.url = url; this.async = async }
  send() {
    const name = String(this.url).replace(/^.*\//, '')
    xhrLog.push(name)
    const buf = readFileSync(dir + name)
    this.status = 200
    this.response = this.responseType === 'arraybuffer' ? buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) : buf.toString()
    this.responseText = buf.toString()
    // A real XHR completes on a later task: the glue relies on that ordering while linking.
    if (this.async && this.onload) setImmediate(() => this.onload())
  }
}
const t0 = Date.now()
process.on('uncaughtException', e => { console.log('UNCAUGHT:', (e && e.message ? e.message : String(e)).slice(0, 300)); console.log((e && e.stack ? e.stack : '').split('\n').filter(l => !l.includes('glue.js:9')).slice(0, 4).map(l => l.slice(0, 200)).join('\n')); process.exit(1) })
process.on('unhandledRejection', e => { console.log('REJECTED:', (e && e.message ? e.message : String(e)).slice(0, 300)); console.log('stages:', stages, 'xhr:', xhrLog); console.log((e && e.stack ? e.stack : '').split('\n').filter(l => !l.includes('glue.js:9') && l.length < 300).slice(0, 14).join('\n')); process.exit(1) })
const stages = []
const factory = (await import(pathToFileURL(dir + 'glue.js').href)).default
const logs = []
const module = await factory({
  preRun: [() => stages.push('preRun')],
  onRuntimeInitialized: () => stages.push('runtimeInitialized'),
  onAbort: (w) => stages.push('abort:' + String(w).slice(0, 120)),
  wasmBinary: readFileSync(dir + 'ClassCADWasm.wasm'),
  locateFile: f => f,
  print: s => logs.push('[out] ' + s),
  printErr: s => logs.push('[err] ' + s),
})
console.log('side modules loaded via XHR shim:', xhrLog); console.log('module instantiated in', Date.now() - t0, 'ms; exports: init=' + typeof module.init + ' execute=' + typeof module.execute + ' FS=' + typeof module.FS)
const { FS } = module
FS.mkdir('/home/web_user/ClassCAD/'); FS.mkdir('/home/web_user/data')
FS.writeFile('.classcad.appkey', key)
FS.writeFile('classcad.cfe', new Int8Array(readFileSync(dir + 'classcad.cfe')))
FS.writeFile('/home/web_user/ClassCAD/classcad.ini', `[common]\n"datapath"="/home/web_user/data"\n"verbosefilename"="/home/web_user/data/classcad.log"\n"verboselevel"="16583"\n"loglevel"="info"\n"tessellatecurves"="0"\n"cc_productrefcreation"="3"\n\n[classes]\nsystem = "classcad.cfe"\n`)
FS.writeFile('filterconfig.json', readFileSync(dir + 'filterconfig.json', 'utf8'))
const t1 = Date.now()
module.init(JSON.stringify({ configurationType: 'file', configurationData: '/home/web_user/ClassCAD/classcad.ini', sendTreePatches: true, compression: false, siteLocation: JSON.stringify(loc) }), false)
console.log('init in', Date.now() - t1, 'ms; log lines:', logs.length, logs.slice(0, 4))
let n = 0
const execute = (cmd) => {
  const messages = [], binary = []
  module.execute(JSON.stringify({ transactionID: 't' + (++n), ...cmd }), module, (_, m) => messages.push(JSON.parse(m)), (mod, ptr, len) => { const bytes = mod.HEAPU8.slice(ptr, ptr + len); binary.push(JSON.parse(inflateRawSync(Buffer.from(bytes)).toString())) })
  return { messages, binary }
}
const t2 = Date.now()
const r1 = execute({ command: 'Execute', task: [{ 'v1.part.create': [{ name: 'P' }] }], options: { undoable: false } })
const part = r1.messages.find(m => m.command === 'Result')?.result?.result ?? r1.messages.find(m => m.command === 'Result')?.result
const r2 = execute({ command: 'Execute', task: [{ 'v1.part.box': [{ id: part, length: 20, width: 20, height: 20 }] }], options: { undoable: false } })
const r3 = execute({ command: 'GetTree' })
const r4 = execute({ command: 'GetEmissionConfig' })
const tree = r3.messages.find(m => m.command === 'Result')?.result
console.log('3 commands in', Date.now() - t2, 'ms')
console.log(JSON.stringify({
  partCreate: { kinds: r1.messages.map(m => m.command + '<' + (m.from ?? m._from_)), part, errors: r1.messages.filter(m => m.command === 'ErrorMessage').map(m => m.attributes?.errorMessage) },
  box: { kinds: r2.messages.map(m => m.command + '<' + (m.from ?? m._from_)), binaryPackages: r2.binary.length, containers: r2.binary.reduce((a, b) => a + (b.containers?.length ?? 0), 0) },
  getTree: { nodes: tree && typeof tree === 'object' ? Object.keys(tree.tree ?? tree).length : typeof tree },
  getEmissionConfig: { kinds: r4.messages.map(m => m.command + '<' + (m.from ?? m._from_)), result: r4.messages.find(m => m.command === 'Result')?.result },
  memoryMB: Math.round(module.HEAPU8.length / 1048576),
}, null, 1))
