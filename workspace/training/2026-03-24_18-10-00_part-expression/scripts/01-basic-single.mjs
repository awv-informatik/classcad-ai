// Create a single named expression with a numeric value
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  console.log('[01] partId:', partId)

  const r = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'width', value: 50 }],
  })

  console.log('[01] result:', r.result, typeof r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  return { partId, result: r.result }
}
