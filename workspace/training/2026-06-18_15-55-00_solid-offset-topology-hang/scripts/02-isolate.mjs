// Isolate what makes solid.offset hang on the 3-hole box. Same core geometry as the
// original crash script; toggle the two differences from my (passing) repro:
//   CC_TEST=snap  -> snapshot('before') before offset
//   CC_TEST=ref   -> create an extra reference box before offset
//   CC_TEST=both  -> both (== the original crash script)
//   CC_TEST=plain -> neither (control; expected to pass)
export default async function (api, { snapshot, filewrite }) {
  const which = process.env.CC_TEST || 'plain'
  const withTimeout = (p, ms, label) =>
    Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms: ${label}`)), ms))])

  const partId = (await api.v1.part.create({ name: 'OffsetIso' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const cyl1 = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: [15, 15, -5] })).result
  const cyl2 = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: [45, 15, -5] })).result
  const cyl3 = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: [30, 30, -5] })).result
  await api.v1.solid.subtraction({ id: eifId, target: boxId, tools: [cyl1, cyl2, cyl3] })
  console.log(`[${which}] box ${boxId} with 3 holes ready`)

  if (which === 'ref' || which === 'both') {
    const refId = (await api.v1.solid.box({ id: eifId, length: 6, width: 6, height: 6, translation: [80, 0, 0] })).result
    console.log(`[${which}] created reference box ${refId}`)
  }
  if (which === 'snap' || which === 'both') {
    await snapshot('before')
    console.log(`[${which}] snapshot('before') done`)
  }

  const out = {}
  try {
    const r = await withTimeout(api.v1.solid.offset({ id: eifId, target: boxId, distance: 2 }), 15000, `offset ${which}`)
    out.offset = { result: r.result, maxLevel: r.maxLevel, messages: r.messages }
    console.log(`[${which}] offset -> maxLevel=${r.maxLevel} messages=${JSON.stringify(r.messages)}`)
  } catch (e) {
    out.offset = { error: e.message }
    console.error(`[${which}] FAILED: ${e.message}`)
  }
  filewrite(out, `isolate-${which}`)
  return out
}
