export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NoViewsTest' })).result
  await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })

  // Try centering before any views are created
  const r = await api.v1.drawing2d.centerView({ id: partId, types: ['TOP', 'FRONT'] })
  console.log('[04] centerView (no views) result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'centerView-no-views')

  // Try centering with no types, no views
  const r2 = await api.v1.drawing2d.centerView({ id: partId })
  console.log('[04] centerView (no views, no types) result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'centerView-no-views-no-types')

  return { partId }
}
