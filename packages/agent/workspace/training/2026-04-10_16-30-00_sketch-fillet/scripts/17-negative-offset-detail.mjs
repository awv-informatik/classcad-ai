// Investigate negative offset on a rectangle (same setup as script 09 which succeeded)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NegOffset' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })
  const lineIds = rect.result
  console.log('[17] lineIds:', JSON.stringify(lineIds))

  await snapshot('before')

  // Negative offset=-10 (same value that worked in script 09)
  const r = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], offset: -10 })
  console.log('[17] neg offset=-10 result:', JSON.stringify(r.result))
  console.log('[17] maxLevel:', r.maxLevel)
  console.log('[17] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'neg-offset-response')

  if (r.result) {
    await snapshot('after-neg-fillet')
  }

  return { partId }
}
