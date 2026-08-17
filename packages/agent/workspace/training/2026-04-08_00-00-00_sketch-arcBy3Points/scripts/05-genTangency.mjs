// Test genTangency — auto tangency constraints when arc is adjacent to existing curve
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TanTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a line
  const lineId = (await api.v1.sketch.line({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [40, 0, 0],
  })).result
  console.log('[05] lineId:', lineId)

  // Arc starting at line endpoint, genTangency=TRUE
  const r = await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [40, 0, 0],
    midPos: [60, 20, 0],
    endPos: [80, 0, 0],
    genTangency: 1, // TRUE
  })
  console.log('[05] arc (genTangency=TRUE):', r.result, 'maxLevel:', r.maxLevel)
  filewrite(r.structure, 'struct-with-tangency')

  await snapshot('with-tangency')

  // Compare: genTangency=FALSE (default)
  const skId2 = (await api.v1.sketch.create({ id: partId })).result
  const lineId2 = (await api.v1.sketch.line({
    id: skId2,
    startPos: [0, 0, 0],
    endPos: [40, 0, 0],
  })).result

  const r2 = await api.v1.sketch.arcBy3Points({
    id: skId2,
    startPos: [40, 0, 0],
    midPos: [60, 20, 0],
    endPos: [80, 0, 0],
    // genTangency defaults to FALSE
  })
  console.log('[05] arc (genTangency=FALSE):', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite(r2.structure, 'struct-no-tangency')

  return { partId }
}
