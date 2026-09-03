// Minimal in-process stand-in for the ClassCAD Drogon worker. Emulates the ONE
// property these tests pin down: CommandConfig is per request — a Result
// carries `structure` / `graphic` only when the request's `config` allows it.
// Records every incoming frame so tests can assert what the client sent.
import { WebSocketServer } from 'ws'

export async function startFakeWorker() {
  const wss = new WebSocketServer({ port: 0 })
  await new Promise(r => wss.once('listening', r))
  const frames = []
  let counter = 500
  wss.on('connection', ws => {
    ws.on('message', data => {
      const req = JSON.parse(data.toString())
      frames.push(req)
      const cfg = req.config ?? {}
      const res = { command: 'Result', _from_: req.command, _transactionID_: req.transactionID }
      if (req.command === 'Execute') {
        const api = Object.keys(req.task?.[0] ?? {})[0] ?? ''
        res.result = { result: /updateFillet/.test(api) ? null : ++counter }
        if (/fail/.test(api)) {
          res.maxLevel = 51
          res.messages = [{ level: 51, levelStr: 'ERROR', code: 1001, message: 'boom' }]
        } else {
          res.messages = [{ level: 31, levelStr: 'INFO', code: 0, message: 'COMMANDCALL' }]
        }
      }
      // Server defaults are full emission; only an explicit false suppresses.
      if (cfg.sendStructure !== false) {
        res.structure = { root: 1, currentProduct: 4, currentInstance: 0, tree: { 4: { id: 4, class: 'CC_Part', name: 'P', stamp: counter } } }
      }
      if (cfg.sendGraphic_Kernel !== false) {
        res.graphic = { containers: [{ id: 100 + counter, type: 1, owner: 4, meshes: [{ id: 1, vertices: [0, 0, 0] }], edges: [{ id: 2 }] }] }
      }
      ws.send(JSON.stringify(res))
    })
  })
  const url = `ws://127.0.0.1:${wss.address().port}/`
  return { url, frames, close: () => new Promise(r => wss.close(() => r())) }
}

export const isMutation = f => f.command === 'Execute' && !/setDatabaseSettings|getAppVersion/.test(JSON.stringify(f.task ?? ''))
export const isPull = f => f.command === 'GetTree'
export const suppressed = f => f.config && f.config.sendStructure === false && f.config.sendGraphic_Kernel === false && f.config.sendGraphic_Sketch === false && f.config.sendGraphic_StructureObj === false && f.config.sendGraphic_Invisible === false && f.config.sendMessages === true
