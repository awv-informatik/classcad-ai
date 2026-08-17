export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NoViews' })).result
  await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })

  // Don't create any views — call getBoundaryBoxFromView directly
  const r1 = await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP'] })
  console.log('[04] no views, specific type result:', JSON.stringify(r1.result))
  console.log('[04] no views, specific type maxLevel:', r1.maxLevel)
  console.log('[04] no views, specific type messages:', JSON.stringify(r1.messages))

  const r2 = await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: [] })
  console.log('[04] no views, empty types result:', JSON.stringify(r2.result))
  console.log('[04] no views, empty types maxLevel:', r2.maxLevel)

  filewrite({
    specificType: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel },
    emptyTypes: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel },
  }, 'no-views')

  return { partId }
}
