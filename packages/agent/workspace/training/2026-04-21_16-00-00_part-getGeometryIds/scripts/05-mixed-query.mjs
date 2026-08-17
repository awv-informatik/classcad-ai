export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MixedTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Query multiple geometry types in a single call
  const r1 = await api.v1.part.getGeometryIds({
    id: partId,
    points: [{ pos: [0, 0, 0] }],           // origin vertex
    lines: [{ pos: [40, 0, 0] }],            // bottom-front edge midpoint
    planes: [{ positions: [[40, 30, 40]] }],  // top face
  })
  console.log('[05] mixed query result:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)
  filewrite(r1.result, 'mixed-query-result')

  // Check: do all category arrays exist in result, or only the ones we queried?
  console.log('[05] result keys:', Object.keys(r1.result).sort().join(', '))

  // Query with empty arrays
  const r2 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [],
    planes: [{ positions: [[40, 30, 40]] }],
  })
  console.log('[05] empty lines + top face:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)

  return { partId }
}
