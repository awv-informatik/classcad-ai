// Test dimension with name parameter — check via setObjectName/structure
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DimTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result

  // Create dimension with explicit name
  const r = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[0]], name: 'width' })
  console.log('[09] named dim result:', r.result, 'maxLevel:', r.maxLevel)

  // Create another with name
  const r2 = await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [rectIds[1]], name: 'height' })
  console.log('[09] named dim2 result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Create one without name for comparison
  const r3 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[2]] })
  console.log('[09] unnamed dim3 result:', r3.result, 'maxLevel:', r3.maxLevel)

  // Dump structure to see names in the tree
  filewrite(r.structure, 'dim-structure')

  await snapshot('named-dims')
  return { partId, skId }
}
