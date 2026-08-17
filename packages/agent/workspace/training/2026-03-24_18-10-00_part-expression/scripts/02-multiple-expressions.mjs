// Create multiple expressions in a single call
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const r = await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'length', value: 100 },
      { name: 'width', value: 50 },
      { name: 'height', value: 75 },
    ],
  })

  console.log('[02] result:', r.result, typeof r.result)
  console.log('[02] maxLevel:', r.maxLevel)
  console.log('[02] messages:', JSON.stringify(r.messages))

  return { partId, result: r.result }
}
