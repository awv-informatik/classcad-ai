export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InvalidType' })).result
  await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })

  await api.v1.drawing2d.view({ id: partId, types: ['TOP'] })

  // Try invalid type string
  const r = await api.v1.drawing2d.placeView({
    id: partId,
    placements: [{ type: 'INVALID', offset: [100, 0, 0] }],
  })
  console.log('[04] invalid type result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[04] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'invalid-type-data')

  return { partId }
}
