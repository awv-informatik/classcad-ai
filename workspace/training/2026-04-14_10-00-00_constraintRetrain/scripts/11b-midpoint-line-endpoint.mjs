// Follow-up: MIDPOINT with a line endpoint instead of a free point
// Also test: does MIDPOINT place the point ON the line, or just at midpoint X?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'MidTest2' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Fixed line from (0,0) to (80,40) — diagonal, so midpoint = (40,20)
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 40, 0] })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [l1] })

  // Test A: free point with MIDPOINT
  const ptA = (await api.v1.sketch.point({ id: skId, pos: [10, 60, 0] })).result
  const posBeforeA = (await api.v1.sketch.getPositions({ id: ptA })).result

  const crA = await api.v1.sketch.constraint({ id: skId, type: 'MIDPOINT', geomIds: [ptA, l1] })
  console.log('[11b] MIDPOINT free point result:', crA.result, 'maxLevel:', crA.maxLevel)

  const posAfterA = (await api.v1.sketch.getPositions({ id: ptA })).result
  console.log('[11b] free point before:', JSON.stringify(posBeforeA))
  console.log('[11b] free point after:', JSON.stringify(posAfterA))
  console.log('[11b] expected midpoint: (40, 20)')

  // Test B: line endpoint with MIDPOINT
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [100, 50, 0], endPos: [120, 70, 0] })).result
  const pts2 = (await api.v1.sketch.getPoints({ id: l2 })).result

  const posBeforeB = (await api.v1.sketch.getPositions({ id: pts2.startId })).result

  const crB = await api.v1.sketch.constraint({ id: skId, type: 'MIDPOINT', geomIds: [pts2.startId, l1] })
  console.log('[11b] MIDPOINT line endpoint result:', crB.result, 'maxLevel:', crB.maxLevel)

  const posAfterB = (await api.v1.sketch.getPositions({ id: pts2.startId })).result
  console.log('[11b] line endpoint before:', JSON.stringify(posBeforeB))
  console.log('[11b] line endpoint after:', JSON.stringify(posAfterB))

  await snapshot('result')

  filewrite({
    freePoint: { before: posBeforeA, after: posAfterA, constraintResult: crA.result },
    lineEndpoint: { before: posBeforeB, after: posAfterB, constraintResult: crB.result },
    expectedMidpoint: { x: 40, y: 20 },
  }, 'midpoint-follow-up-data')

  return { partId }
}
