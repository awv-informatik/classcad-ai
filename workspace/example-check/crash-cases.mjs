// Re-verify worker crash paths on a PRIVATE worker (ws://127.0.0.1:9120). One session per case.
import { execSync } from 'child_process'
import { connectSession, buildScriptApi } from '@classcad/script/node'
import registry from '@classcad/skill/method-registry.json' with { type: 'json' }
const URL = 'ws://127.0.0.1:9120/'
const START = '/private/tmp/claude-501/-Users-dev-dev-awv-classcad/a1557866-6caa-45dd-be30-58eb0681332f/scratchpad/worker/start-9120.sh'
const up = () => { try { execSync('nc -z -w 1 127.0.0.1 9120'); return true } catch { return false } }
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT')), ms))])
const eif = async api => { const p = (await api.v1.part.create({ name: 'P' })).result; return { p, e: (await api.v1.part.entityInjection({ id: p })).result } }
const cases = {
  'solid.translation on destroyed boolean target': async api => { const { e } = await eif(api); const a = (await api.v1.solid.box({ id: e, length: 10, width: 10, height: 10 })).result; const b = (await api.v1.solid.box({ id: e, length: 10, width: 10, height: 10, translation: [100, 0, 0] })).result; const r = await api.v1.solid.intersection({ id: e, target: a, tools: [b] }); console.log('   intersection:', r.result, r.maxLevel, r.messages?.map(m => m.code + ' ' + m.message.slice(0, 60))); return api.v1.solid.translation({ id: e, target: a, translation: [1, 0, 0] }) },
  'solid.translation on destroyed subtraction target': async api => { const { e } = await eif(api); const a = (await api.v1.solid.box({ id: e, length: 10, width: 10, height: 10 })).result; const b = (await api.v1.solid.box({ id: e, length: 20, width: 20, height: 20, translation: [-5, -5, -5] })).result; const r = await api.v1.solid.subtraction({ id: e, target: a, tools: [b] }); console.log('   subtraction:', r.result, r.maxLevel, r.messages?.map(m => m.code + ' ' + m.message.slice(0, 60))); return api.v1.solid.translation({ id: e, target: a, translation: [1, 0, 0] }) },
  'curve.advancedPolyline with 1 PLD': async api => { const { e } = await eif(api); const sh = (await api.v1.curve.shape({ id: e })).result; return api.v1.curve.advancedPolyline({ id: sh, pld: [{ xa: 0, ya: 0 }] }) },
  'curve.bezierCurve points []': async api => { const { e } = await eif(api); const sh = (await api.v1.curve.shape({ id: e })).result; return api.v1.curve.bezierCurve({ id: sh, points: [] }) },
  'common.requestVisualisation ids [-1]': async api => { await eif(api); return api.v1.common.requestVisualisation({ ids: [-1] }) },
  'common.setUserData id -1': async api => { await eif(api); return api.v1.common.setUserData({ id: -1, key: 'k', value: 'v' }) },
  'common.getUserData id -1': async api => { await eif(api); return api.v1.common.getUserData({ id: -1, key: 'k' }) },
  'assembly.moveUnderConstraints without start (revolute)': async api => { const asm = (await api.v1.assembly.create({})).result; const tA = (await api.v1.assembly.partTemplate({ name: 'A' })).result; await api.v1.part.box({ id: tA, length: 60, width: 40, height: 10 }); const wA = (await api.v1.part.workCSys({ id: tA })).result; const tB = (await api.v1.assembly.partTemplate({ name: 'B' })).result; await api.v1.part.box({ id: tB, length: 80, width: 20, height: 8 }); const wB = (await api.v1.part.workCSys({ id: tB })).result; await api.v1.assembly.setCurrentProduct({ id: asm }); const i1 = (await api.v1.assembly.instance({ productId: tA, ownerId: asm })).result; const i2 = (await api.v1.assembly.instance({ productId: tB, ownerId: asm })).result; await api.v1.assembly.fastenedOrigin({ id: asm, mate1: { path: [i1], csys: wA } }); await api.v1.assembly.revolute({ id: asm, mate1: { path: [i1], csys: wA }, mate2: { path: [i2], csys: wB } }); return api.v1.assembly.moveUnderConstraints({ id: asm, rotation: { xDir: [0, -1, 0], yDir: [1, 0, 0], zDir: [0, 0, 1] } }) },
  'assembly.moveUnderConstraints without start': async api => { const asm = (await api.v1.assembly.create({})).result; const t = (await api.v1.assembly.partTemplate({ name: 'T' })).result; await api.v1.part.box({ id: t, length: 10, width: 10, height: 10 }); const cs = (await api.v1.part.workCSys({ id: t })).result; await api.v1.assembly.setCurrentProduct({ id: asm }); const i = (await api.v1.assembly.instance({ productId: t, ownerId: asm })).result; await api.v1.assembly.fastenedOrigin({ id: asm, mate1: { path: [i], csys: cs } }); return api.v1.assembly.moveUnderConstraints({ id: asm, translation: [1, 0, 0] }) },
  'assembly.finishMovingUnderConstraints without start': async api => { const asm = (await api.v1.assembly.create({})).result; return api.v1.assembly.finishMovingUnderConstraints({ id: asm }) },
  'sketch.dimension HD with dimPos (non-crash bug)': async api => { const p = (await api.v1.part.create({})).result; const top = (await api.v1.part.getWorkGeometry({ id: p, name: 'Top' })).result; const sk = (await api.v1.sketch.create({ id: p, planeId: top })).result; const l = (await api.v1.sketch.line({ id: sk, startPos: [0, 0, 0], endPos: [40, 10, 0] })).result; const pts = (await api.v1.sketch.getPoints({ id: l })).result; return api.v1.sketch.dimension({ id: sk, type: 'HORIZONTAL_DISTANCE', geomIds: [pts.startId, pts.endId], value: 40, dimPos: [20, -10, 0] }) },
}
const out = {}
for (const [name, fn] of Object.entries(cases)) {
  let session, res
  try {
    for (let i = 0; i < 30 && !up(); i++) { execSync(`bash ${START}`); await new Promise(r => setTimeout(r, 1000)) }
    await new Promise(r => setTimeout(r, 1500))
    session = await connectSession(URL, {})
    const api = buildScriptApi(session, { registry, strict: false })
    const sanity = await withTimeout(api.v1.common.clear(), 10000)
    if (sanity?.maxLevel == null) throw new Error('sanity call failed')
    const r = await withTimeout(fn(api), 20000)
    res = { returned: { result: r?.result ?? null, maxLevel: r?.maxLevel, msg: r?.messages?.[0]?.message?.slice(0, 120) } }
  } catch (e) { res = { error: String(e?.message ?? e).slice(0, 160) } }
  await new Promise(r => setTimeout(r, 2000))
  res.workerAlive = up()
  if (!res.workerAlive) await new Promise(r => setTimeout(r, 1000))
  try { await session?.close?.() } catch {}
  out[name] = res
  console.log(name, JSON.stringify(res))
}
process.exit(0)
