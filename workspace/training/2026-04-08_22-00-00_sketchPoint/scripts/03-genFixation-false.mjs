// Test genFixation=FALSE — point should have no auto-fixation constraint
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NoFixationTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a point with genFixation=FALSE
  const r1 = await api.v1.sketch.point({ id: skId, pos: [30, 20, 0], genFixation: 0 })
  console.log('[03] point with genFixation=FALSE — result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Dump structure to compare
  filewrite(r1.structure, 'structure-genFixation-false')

  await snapshot('point-genFixation-false')
  return { partId, skId, pointId: r1.result }
}
