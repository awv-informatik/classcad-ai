// What happens with circular references?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const r = await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'a', value: 'b + 1' },
      { name: 'b', value: 'a + 1' },
    ],
  })
  console.log('[18] circular result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[18] messages:', JSON.stringify(r.messages))

  return { partId }
}
