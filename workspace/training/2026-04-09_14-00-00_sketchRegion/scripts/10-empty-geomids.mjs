// Error case: empty geomIds array
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EmptyTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const r = await api.v1.sketch.sketchRegion({ id: skId, geomIds: [] })
  console.log('[10] empty geomIds result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[10] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'empty-geomids')

  return { partId }
}
