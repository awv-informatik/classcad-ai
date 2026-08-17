// Test that offset overrides radius when both are provided
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletOverride' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })
  const lineIds = rect.result

  // Provide both offset=5 and radius=30 — docs say radius is ignored when offset is set
  const r = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], offset: 5, radius: 30 })
  console.log('[04] both params result:', JSON.stringify(r.result))
  console.log('[04] maxLevel:', r.maxLevel)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'override-response')
  await snapshot('offset-overrides-radius')

  return { partId, filletResult: r.result }
}
