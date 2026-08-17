// Create multiple sketch regions in the same sketch
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiRegion' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Rectangle on the left
  const rect1 = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [30, 20, 0],
  })

  // Rectangle on the right (non-overlapping)
  const rect2 = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [50, 0, 0],
    endPos: [80, 20, 0],
  })

  // Create two regions
  const r1 = await api.v1.sketch.sketchRegion({
    id: skId,
    geomIds: rect1.result,
    name: 'LeftRegion',
  })
  console.log('[05] region 1 result:', r1.result, 'maxLevel:', r1.maxLevel)

  const r2 = await api.v1.sketch.sketchRegion({
    id: skId,
    geomIds: rect2.result,
    name: 'RightRegion',
  })
  console.log('[05] region 2 result:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({
    region1: { id: r1.result, maxLevel: r1.maxLevel },
    region2: { id: r2.result, maxLevel: r2.maxLevel },
  }, 'multi-regions')

  await snapshot('multi-regions')
  return { partId, regionIds: [r1.result, r2.result] }
}
