// Repro for TODO #3: 2D boolean self-reference (target == tool) hangs the server.
// Also probes the shared-root-cause siblings (entries 4, 45): solid union/sub/intersect/merge self-ref.
// Each call wrapped in a JS timeout; we STOP at the first hang because the worker wedges.
// Pass which test to run via env CC_TEST (default: union2d). One test per worker lifecycle.
export default async function (api, { filewrite }) {
  const which = process.env.CC_TEST || 'union2d'
  const withTimeout = (p, ms, label) =>
    Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms: ${label}`)), ms))])

  const partId = (await api.v1.part.create({ name: 'BoolSelf' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const out = {}

  async function mk2dShape() {
    const s = (await api.v1.curve.shape({ id: eifId })).result
    await api.v1.curve.circle({ id: s, centerPos: [0, 0, 0], radius: 30 })
    return s
  }
  async function mkSolid() {
    return (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 40 })).result
  }

  try {
    if (which === 'union2d') {
      const s = await mk2dShape()
      const r = await withTimeout(api.v1.curve.union2d({ target: s, tool: s }), 8000, 'union2d self')
      out.union2d = { maxLevel: r.maxLevel, messages: r.messages }
    } else if (which === 'subtraction2d') {
      const s = await mk2dShape()
      const r = await withTimeout(api.v1.curve.subtraction2d({ target: s, tool: s }), 8000, 'subtraction2d self')
      out.subtraction2d = { maxLevel: r.maxLevel, messages: r.messages }
    } else if (which === 'intersection2d') {
      const s = await mk2dShape()
      const r = await withTimeout(api.v1.curve.intersection2d({ target: s, tool: s }), 8000, 'intersection2d self')
      out.intersection2d = { maxLevel: r.maxLevel, messages: r.messages }
    } else if (which === 'solidUnion') {
      const b = await mkSolid()
      const r = await withTimeout(api.v1.solid.union({ id: eifId, target: b, tools: [b] }), 8000, 'solid.union self')
      out.solidUnion = { maxLevel: r.maxLevel, messages: r.messages }
    } else if (which === 'solidSub') {
      const b = await mkSolid()
      const r = await withTimeout(api.v1.solid.subtraction({ id: eifId, target: b, tools: [b] }), 8000, 'solid.subtraction self')
      out.solidSub = { maxLevel: r.maxLevel, messages: r.messages }
    } else if (which === 'solidIntersect') {
      const b = await mkSolid()
      const r = await withTimeout(api.v1.solid.intersection({ id: eifId, target: b, tools: [b] }), 8000, 'solid.intersection self')
      out.solidIntersect = { maxLevel: r.maxLevel, messages: r.messages }
    } else if (which === 'solidMerge') {
      const b = await mkSolid()
      const r = await withTimeout(api.v1.solid.merge({ id: eifId, target: b, tools: [b] }), 8000, 'solid.merge self')
      out.solidMerge = { maxLevel: r.maxLevel, messages: r.messages }
    }
    console.log(`[repro:${which}]`, JSON.stringify(out))
  } catch (e) {
    out[which] = { error: e.message }
    console.error(`[repro:${which}] FAILED: ${e.message}`)
  }

  filewrite(out, `repro-${which}`)
  return out
}
