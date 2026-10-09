// Minimal in-process stand-in for the ClassCAD Drogon worker. Emulates the
// properties these tests pin down (per-CONNECTION emission config):
//   • the config lives on the connection: SetEmissionConfig merges a partial `config`
//     object into it and echoes the effective flags, GetEmissionConfig echoes them;
//     a `config` field on any other request is ignored
//   • a Result carries `structure` / `graphic` only when the CONNECTION config
//     allows it (server defaults: full content, bundled delivery)
//   • GetTree always carries the structure (explicit request)
//   • an Execute with a v1.common.requestVisualisation task always carries
//     the graphic (explicit request)
// Records every incoming frame so tests can assert what the client sent;
// sibling() sends every connection a frame as the server fans out another
// participant's (no request of its own answered by it).
import { WebSocketServer } from 'ws'

/** Server-side defaults of a fresh WS connection (CommandConfig.h). */
export const SERVER_DEFAULT_CONFIG = {
  sendStructure: true, sendStructure_Patch: false, sendStructure_Compressed: false,
  sendStructure_Immediately: false, sendStructure_ImmediatelyBinary: false,
  sendGraphic_Kernel: true, sendGraphic_StructureObj: true, sendGraphic_Sketch: true, sendGraphic_Invisible: true,
  sendGraphic_Compressed: false, sendGraphic_Immediately: false, sendGraphic_ImmediatelyBinary: false,
  sendGraphic_Multipackage: false, sendGraphic_UseDraco: false, sendGraphic_UseDracoHybrid: false,
  sendGraphic_AdvancedNotifications: false, sendMessages: true, sendMessages_Immediately: false,
  sendMessages_MinLevel: 31, storeState: false, safeApi: false,
}

/**
 * @param {{ configCommands?: boolean }} [opts] configCommands:false emulates an
 *   engine that predates GetEmissionConfig/SetEmissionConfig (replies with the
 *   CommandFactory's "Unknown command" error and no `result`).
 */
export async function startFakeWorker(opts = {}) {
  const configCommands = opts.configCommands !== false
  const wss = new WebSocketServer({ port: opts.port ?? 0 })
  await new Promise(r => wss.once('listening', r))
  const frames = []
  let counter = 500
  wss.on('connection', ws => {
    // The per-connection config — the one thing that survives between requests.
    let config = { ...SERVER_DEFAULT_CONFIG }
    ws.on('message', data => {
      const req = JSON.parse(data.toString())
      frames.push(req)
      const res = { command: 'Result', _from_: req.command, _transactionID_: req.transactionID }
      if (!configCommands && (req.command === 'SetEmissionConfig' || req.command === 'GetEmissionConfig')) {
        res.maxLevel = 51
        res.messages = [{ level: 51, levelStr: 'ERROR', code: 0, message: 'Unknown command. Invalid Request!' }]
        ws.send(JSON.stringify(res)); return
      }
      if (req.command === 'SetEmissionConfig') {
        // Partial merge; unknown keys are ignored like the real MergeConfigObject does.
        for (const [k, v] of Object.entries(req.config ?? {})) if (k in config) config[k] = v
        res.result = { ...config }
        ws.send(JSON.stringify(res)); return
      }
      if (req.command === 'GetEmissionConfig') {
        res.result = { ...config }
        ws.send(JSON.stringify(res)); return
      }
      let forceGraphic = false
      if (req.command === 'Execute') {
        const api = Object.keys(req.task?.[0] ?? {})[0] ?? ''
        forceGraphic = api === 'v1.common.requestVisualisation'
        res.result = { result: /updateFillet|requestVisualisation/.test(api) ? null : ++counter }
        if (/fail/.test(api)) {
          res.maxLevel = 51
          res.messages = [{ level: 51, levelStr: 'ERROR', code: 1001, message: 'boom' }]
        } else {
          res.messages = [{ level: 31, levelStr: 'INFO', code: 0, message: 'COMMANDCALL' }]
        }
      }
      const explicitTree = req.command === 'GetTree' || req.command === 'Sync'
      if (config.sendStructure || explicitTree) {
        res.structure = { root: 1, currentProduct: 4, currentInstance: 0, tree: { 4: { id: 4, class: 'CC_Part', name: 'P', stamp: counter } } }
      }
      if (config.sendGraphic_Kernel || forceGraphic) {
        res.graphic = { containers: [{ id: 100 + counter, type: 1, owner: 4, meshes: [{ id: 1, vertices: [0, 0, 0] }], edges: [{ id: 2 }] }] }
      }
      ws.send(JSON.stringify(res))
    })
  })
  const url = `ws://127.0.0.1:${wss.address().port}/`
  const sibling = frame => { for (const ws of wss.clients) ws.send(JSON.stringify(frame)) }
  return { url, frames, sibling, close: () => new Promise(r => wss.close(() => r())) }
}

export const isMutation = f => f.command === 'Execute' && !/setDatabaseSettings|getAppVersion/.test(JSON.stringify(f.task ?? ''))
export const isPull = f => f.command === 'GetTree'
export const isSetEmissionConfig = f => f.command === 'SetEmissionConfig'
/** The scripting profile (SUPPRESS_EMISSION): no structure, no graphic category, messages on, bundled delivery. */
export const isSuppressProfile = f => isSetEmissionConfig(f) && f.config && f.config.sendStructure === false && f.config.sendGraphic_Kernel === false && f.config.sendGraphic_Sketch === false && f.config.sendGraphic_StructureObj === false && f.config.sendGraphic_Invisible === false && f.config.sendMessages === true && f.config.sendGraphic_ImmediatelyBinary === false && f.config.sendStructure_Patch === false
/** No request other than SetEmissionConfig may carry emission flags. */
export const carriesNoConfig = f => isSetEmissionConfig(f) || f.config === undefined
/** A SetEmissionConfig that puts the server defaults back (what runScript restores after a script). */
export const isRestoreProfile = f => isSetEmissionConfig(f) && f.config && f.config.sendStructure === true && f.config.sendGraphic_Kernel === true && f.config.sendGraphic_Sketch === true && f.config.sendMessages === true
