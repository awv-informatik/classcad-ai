// Test genTangency with arc adjacent to another arc
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TanArc' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // First arc
  const arc1 = (await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [0, 0, 0],
    midPos: [20, 20, 0],
    endPos: [40, 0, 0],
  })).result
  console.log('[11] arc1:', arc1)

  // Second arc starting at the endpoint of first, genTangency=TRUE
  const r2 = await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [40, 0, 0],
    midPos: [60, -20, 0],
    endPos: [80, 0, 0],
    genTangency: 1,
  })
  console.log('[11] arc2 (genTangency=TRUE):', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite(r2.structure, 'struct-arc-to-arc')

  await snapshot('arc-to-arc')
  return { partId }
}
