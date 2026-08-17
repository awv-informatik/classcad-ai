// Test genFixation parameter — default TRUE vs explicit FALSE
// Arc at origin should get fixation constraint; arc away from origin should not
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FixTest' })).result

  // Sketch 1: Arc at origin, genFixation=TRUE (default)
  const skId1 = (await api.v1.sketch.create({ id: partId })).result
  const r1 = await api.v1.sketch.arcBy3Points({
    id: skId1,
    startPos: [0, 0, 0],
    midPos: [20, 20, 0],
    endPos: [40, 0, 0],
  })
  console.log('[03] Arc A (origin, genFix=default):', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite(r1.structure, 'structA-with-fixation')

  // Sketch 2: Arc at origin, genFixation=FALSE
  const skId2 = (await api.v1.sketch.create({ id: partId })).result
  const r2 = await api.v1.sketch.arcBy3Points({
    id: skId2,
    startPos: [0, 0, 0],
    midPos: [20, 20, 0],
    endPos: [40, 0, 0],
    genFixation: 0, // FALSE
  })
  console.log('[03] Arc B (origin, genFix=FALSE):', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite(r2.structure, 'structB-no-fixation')

  // Sketch 3: Arc away from origin, genFixation=TRUE (default)
  const skId3 = (await api.v1.sketch.create({ id: partId })).result
  const r3 = await api.v1.sketch.arcBy3Points({
    id: skId3,
    startPos: [100, 100, 0],
    midPos: [120, 120, 0],
    endPos: [140, 100, 0],
  })
  console.log('[03] Arc C (off-origin, genFix=default):', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite(r3.structure, 'structC-off-origin')

  return { partId }
}
