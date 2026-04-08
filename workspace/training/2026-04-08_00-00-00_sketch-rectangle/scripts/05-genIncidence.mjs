// 05 — genIncidence: does a new rectangle snap to existing points?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IncTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // First rectangle
  const r1 = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [40, 30, 0],
  })
  console.log('[05] rect1 IDs:', r1.result)

  // Second rectangle sharing a corner with rect1 (40,30,0), genIncidence=TRUE (default)
  const r2 = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [40, 30, 0],
    endPos: [80, 60, 0],
    genIncidence: 1, // TRUE (default)
  })
  console.log('[05] rect2 (genIncidence=TRUE) IDs:', r2.result)

  // Third rectangle sharing a corner with rect1 (0,30,0), genIncidence=FALSE
  const r3 = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [0, 30, 0],
    endPos: [-40, 60, 0],
    genIncidence: 0, // FALSE
  })
  console.log('[05] rect3 (genIncidence=FALSE) IDs:', r3.result)

  await snapshot('genIncidence')
  return { partId }
}
