// Test: batch dimension creation and name param
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'DimTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Rectangle
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  console.log('[09] rect lines:', rectIds)

  // Batch create: OFFSET on bottom, OFFSET on left side, with names
  const batchR = await api.v1.sketch.dimension([
    { id: skId, name: 'width', type: 'OFFSET', geomIds: [rectIds[0]] },
    { id: skId, name: 'height', type: 'OFFSET', geomIds: [rectIds[1]] },
    { id: skId, type: 'OFFSET', geomIds: [rectIds[2]] }  // unnamed
  ])
  console.log('[09] batch result:', batchR.result, 'maxLevel:', batchR.maxLevel)

  // Check names in structure tree
  const dims = batchR.result.map(id =>
    Object.values(batchR.structure.tree).find(n => n.id === id)
  )
  dims.forEach((d, i) => console.log(`[09] dim${i}: id=${d?.id} name="${d?.name}" class="${d?.class}"`))

  filewrite({
    batchResult: batchR.result,
    maxLevel: batchR.maxLevel,
    dims: dims.map(d => ({ id: d?.id, name: d?.name, class: d?.class }))
  }, 'batch-name-data')

  await snapshot('result')

  return { partId }
}
