// Test genIncidence — auto coincidence constraints when arc endpoints match existing geometry
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IncTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a line first
  const lineId = (await api.v1.sketch.line({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [40, 0, 0],
  })).result
  console.log('[04] lineId:', lineId)

  // Arc starting at line endpoint (40,0,0) — genIncidence=TRUE (default)
  const arcId = (await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [40, 0, 0],
    midPos: [60, 20, 0],
    endPos: [80, 0, 0],
  })).result
  console.log('[04] arcId (genIncidence=TRUE):', arcId, 'maxLevel:', arcId)

  const r1 = await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [40, 0, 0],
    midPos: [60, 20, 0],
    endPos: [80, 0, 0],
  })
  filewrite(r1.structure, 'struct-with-incidence')

  await snapshot('with-incidence')

  // New sketch — genIncidence=FALSE
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
    genIncidence: 0, // FALSE
  })
  console.log('[04] arc (genIncidence=FALSE):', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite(r2.structure, 'struct-no-incidence')

  return { partId }
}
