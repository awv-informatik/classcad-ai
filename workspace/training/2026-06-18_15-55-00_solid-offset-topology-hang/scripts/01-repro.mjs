// Repro for TODO #48: solid.offset on a box with 3 cylinder holes hangs at 100% CPU.
// JS-side timeout so a hang surfaces instead of wedging the harness.
// CC_TEST: 'multi' (3 holes, the reported hang) | 'simple' (plain box, baseline) | 'onehole' (single cut).
export default async function (api, { filewrite }) {
  const which = process.env.CC_TEST || 'multi'
  const withTimeout = (p, ms, label) =>
    Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms: ${label}`)), ms))])

  const partId = (await api.v1.part.create({ name: 'OffsetTopo' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const out = {}

  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result

  if (which === 'onehole' || which === 'multi') {
    const c1 = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: [15, 15, -5] })).result
    const tools = [c1]
    if (which === 'multi') {
      const c2 = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: [45, 15, -5] })).result
      const c3 = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: [30, 30, -5] })).result
      tools.push(c2, c3)
    }
    await api.v1.solid.subtraction({ id: eifId, target: boxId, tools })
    console.log(`[repro:${which}] subtracted ${tools.length} hole(s) from box ${boxId}`)
  }

  try {
    const r = await withTimeout(api.v1.solid.offset({ id: eifId, target: boxId, distance: 2 }), 15000, `offset ${which}`)
    out[which] = { result: r.result, maxLevel: r.maxLevel, messages: r.messages }
    console.log(`[repro:${which}] offset -> maxLevel=${r.maxLevel} messages=${JSON.stringify(r.messages)}`)
  } catch (e) {
    out[which] = { error: e.message }
    console.error(`[repro:${which}] FAILED: ${e.message}`)
  }

  filewrite(out, `repro-${which}`)
  return out
}
