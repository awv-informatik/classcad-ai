// wasm-worker.ts — the published ClassCAD WASM engine inside a Node
// worker_thread. This is what ClassCADWasmWorker.js does in the browser,
// minus the browser: the engine is synchronous and blocks its thread for the
// duration of a command, so it lives in its own thread and the daemon's
// event loop (other sessions, the bridge, /health) stays responsive.
//
// Two shims make the web-built engine run in Node:
//   • location: the engine's license key is bound to "allowed origins"
//     (configured on classcad.ch/user). The engine compares
//     globalThis.location.origin with the siteLocation handed to init() and
//     with the key's origins. The MCP presents itself as one of those
//     origins (CLASSCAD_WASM_ORIGIN, default http://localhost:3000 - the
//     origin most dev keys already allow).
//   • XMLHttpRequest: the glue was built with -sENVIRONMENT=web and loads its
//     side modules (lgs2d, lgs3d, ExpWasm) through XHR. We answer those from
//     the local asset directory. A real XHR completes on a later task; the
//     glue relies on that ordering while linking, hence the deferred onload.
//
// Protocol with the parent (see wasm.ts):
//   → { type:'init', dir, key, origin }         ← { type:'ready', ms, memoryMB } | { type:'error', message }
//   → { type:'execute', id, command }           ← { type:'result', id, messages, binaryMessages } | { type:'error', id, message }
import { parentPort } from 'node:worker_threads'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { inflateRawSync } from 'node:zlib'

type InitMsg = { type: 'init'; dir: string; key: string; origin: string }
type ExecMsg = { type: 'execute'; id: number; command: Record<string, unknown> }

const port = parentPort!
let engine: any = null

function installShims(dir: string, origin: string): Record<string, unknown> {
  const u = new URL(origin)
  const loc = {
    href: u.href,
    origin: u.origin,
    protocol: u.protocol,
    host: u.host,
    hostname: u.hostname,
    port: u.port,
    pathname: '/',
    search: '',
    hash: '',
  }
  ;(globalThis as any).location = loc
  ;(globalThis as any).XMLHttpRequest = class {
    url = ''
    async = true
    status = 0
    responseType = ''
    response: unknown = null
    responseText = ''
    onload: (() => void) | null = null
    onerror: ((e: unknown) => void) | null = null
    open(_method: string, url: string, async = true) {
      this.url = String(url)
      this.async = async
    }
    setRequestHeader() {}
    send() {
      const name = this.url.replace(/^.*\//, '')
      let buf: Buffer
      try {
        buf = readFileSync(join(dir, name))
      } catch (err) {
        this.status = 404
        if (this.onerror) this.onerror(err)
        return
      }
      this.status = 200
      this.response = this.responseType === 'arraybuffer' ? buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) : buf.toString()
      this.responseText = this.responseType === 'arraybuffer' ? '' : buf.toString()
      if (this.async && this.onload) setImmediate(() => this.onload!())
    }
  }
  return loc
}

async function init(msg: InitMsg): Promise<void> {
  const t0 = Date.now()
  const loc = installShims(msg.dir, msg.origin)
  const factory = (await import(pathToFileURL(join(msg.dir, 'ClassCADWasm.js')).href)).default
  const logs: string[] = []
  engine = await factory({
    wasmBinary: readFileSync(join(msg.dir, 'ClassCADWasm.wasm')),
    locateFile: (f: string) => f,
    print: (s: string) => logs.push(s),
    printErr: (s: string) => logs.push(s),
  })
  // Same file layout ClassCADWasmWorker.js prepares (classcadkey mode).
  const { FS } = engine
  FS.mkdir('/home/web_user/ClassCAD/')
  FS.mkdir('/home/web_user/data')
  FS.writeFile('.classcad.appkey', msg.key)
  FS.writeFile('classcad.cfe', new Int8Array(readFileSync(join(msg.dir, 'classcad.cfe'))))
  FS.writeFile(
    '/home/web_user/ClassCAD/classcad.ini',
    '[common]\n"datapath"="/home/web_user/data"\n"verbosefilename"="/home/web_user/data/classcad.log"\n"verboselevel"="16583"\n"loglevel"="info"\n"tessellatecurves"="0"\n"cc_productrefcreation"="3"\n\n[classes]\nsystem = "classcad.cfe"\n',
  )
  FS.writeFile('filterconfig.json', readFileSync(join(msg.dir, 'filterconfig.json'), 'utf8'))
  engine.init(
    JSON.stringify({
      configurationType: 'file',
      configurationData: '/home/web_user/ClassCAD/classcad.ini',
      sendTreePatches: true,
      compression: false,
      siteLocation: JSON.stringify(loc),
    }),
    false,
  )
  port.postMessage({ type: 'ready', ms: Date.now() - t0, memoryMB: Math.round(engine.HEAPU8.length / 1048576), logs: logs.slice(0, 10) })
}

function execute(msg: ExecMsg): void {
  const messages: unknown[] = []
  const binaryMessages: unknown[] = []
  engine.execute(
    JSON.stringify(msg.command),
    engine,
    (_m: unknown, text: string) => {
      messages.push(JSON.parse(text))
    },
    (mod: any, ptr: number, len: number) => {
      const bytes = mod.HEAPU8.slice(ptr, ptr + len)
      binaryMessages.push(JSON.parse(inflateRawSync(Buffer.from(bytes)).toString()))
    },
  )
  port.postMessage({ type: 'result', id: msg.id, messages, binaryMessages })
}

port.on('message', (msg: InitMsg | ExecMsg) => {
  try {
    if (msg.type === 'init') {
      init(msg).catch(err => port.postMessage({ type: 'error', message: err instanceof Error ? err.message : String(err) }))
    } else if (msg.type === 'execute') {
      if (!engine) throw new Error('engine not initialized')
      execute(msg)
    }
  } catch (err) {
    port.postMessage({ type: 'error', id: (msg as ExecMsg).id, message: err instanceof Error ? err.message : String(err) })
  }
})
