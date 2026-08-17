// Repro for TODO #5: referencing a CONSUMED tool solid id (after keepTools=false)
// in a subsequent solid op hangs the server. Compare against a NEVER-EXISTED id,
// which the doc says returns a clean code-1006 error.
// CC_TEST picks the follow-up op to try on the consumed id. One per worker lifecycle.
export default async function (api, { filewrite }) {
  const which = process.env.CC_TEST || 'subtraction'
  const withTimeout = (p, ms, label) =>
    Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms: ${label}`)), ms))])

  const partId = (await api.v1.part.create({ name: 'Consumed' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const out = {}

  if (which === 'nonexistent') {
    // Baseline: an id that never existed -> doc says clean 1006 error
    const target = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 40 })).result
    const bogus = 999999
    try {
      const r = await withTimeout(api.v1.solid.subtraction({ id: eifId, target, tools: [bogus] }), 8000, 'nonexistent tool')
      out.nonexistent = { maxLevel: r.maxLevel, messages: r.messages }
    } catch (e) { out.nonexistent = { error: e.message } }
    console.log('[repro:nonexistent]', JSON.stringify(out))
    filewrite(out, `repro-${which}`)
    return out
  }

  // Consume a tool via a real subtraction (keepTools=false default)
  const target = (await api.v1.solid.box({ id: eifId, length: 60, width: 60, height: 60 })).result
  const tool = (await api.v1.solid.cylinder({ id: eifId, diameter: 20, height: 100 })).result
  const sub1 = await api.v1.solid.subtraction({ id: eifId, target, tools: [tool] })
  console.log('[repro] first subtraction: maxLevel', sub1.maxLevel, '-> tool', tool, 'now consumed')

  // Now reference the consumed `tool` id in a follow-up op
  try {
    let r
    if (which === 'subtraction') {
      // use consumed tool as a tool again
      r = await withTimeout(api.v1.solid.subtraction({ id: eifId, target, tools: [tool] }), 8000, 'sub w/ consumed tool')
    } else if (which === 'subtractionTarget') {
      // use consumed tool as the target
      r = await withTimeout(api.v1.solid.subtraction({ id: eifId, target: tool, tools: [target] }), 8000, 'sub w/ consumed target')
    } else if (which === 'translation') {
      r = await withTimeout(api.v1.solid.translation({ id: eifId, target: tool, translation: [10, 0, 0] }), 8000, 'translate consumed')
    } else if (which === 'copy') {
      r = await withTimeout(api.v1.solid.copy({ id: eifId, target: tool }), 8000, 'copy consumed')
    }
    out[which] = { maxLevel: r.maxLevel, messages: r.messages }
    console.log(`[repro:${which}]`, JSON.stringify(out[which]))
  } catch (e) {
    out[which] = { error: e.message }
    console.error(`[repro:${which}] FAILED: ${e.message}`)
  }

  filewrite(out, `repro-${which}`)
  return out
}
