export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EmptyTypes' })).result
  await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })

  // Create only TOP and FRONT views
  await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT'] })

  // Empty types array — should return all existing views
  const r1 = await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: [] })
  console.log('[02] empty types[] result:', JSON.stringify(r1.result))
  console.log('[02] empty types[] maxLevel:', r1.maxLevel)

  // Omit types entirely — test if it works without the param
  const r2 = await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId })
  console.log('[02] no types param result:', JSON.stringify(r2.result))
  console.log('[02] no types param maxLevel:', r2.maxLevel)

  filewrite({ emptyArray: r1.result, omitted: r2.result }, 'empty-types-results')

  return { partId }
}
