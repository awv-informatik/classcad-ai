// Script 20: Does the solver work when the sketch has an explicit plane?
// Hypothesis: sketch with planeReference=0 (no plane) prevents the solver from running
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Find the standard Top plane (XY) from the part's structure
  const partR = await api.v1.part.create({ name: 'PlaneTest' })
  const pid = partR.result
  const tree = partR.structure?.tree || {}
  const planes = Object.values(tree).filter(n => n.class === 'CC_WorkPlane')
  console.log('[20] standard planes:', planes.map(p => ({ id: p.id, name: p.name })))

  const topPlane = planes.find(p => p.name === 'Top')
  console.log('[20] using Top plane:', topPlane?.id)

  // ====== TEST A: Sketch WITHOUT plane (planeReference=0) ======
  const skNone = (await api.v1.sketch.create({ id: pid })).result
  console.log('[20A] sketch without plane:', skNone)

  const rectA = (await api.v1.sketch.rectangle({
    id: skNone, startPos: [0, 0, 0], endPos: [60, 40, 0],
  })).result
  const dimA = (await api.v1.sketch.dimension({ id: skNone, type: 'OFFSET', geomIds: [rectA[0]] })).result
  const updA = await api.v1.sketch.updateDimension({ id: dimA, value: 100 })
  const ptsA = (await api.v1.sketch.getPoints({ id: rectA[0] })).result
  const posA = (await api.v1.sketch.getPositions({ id: ptsA.endId })).result
  console.log('[20A] NO PLANE — updateDim result=%d, endPos=(%s,%s)',
    updA.result, posA.pos.x, posA.pos.y)

  // ====== TEST B: Sketch WITH explicit Top plane ======
  const skPlane = (await api.v1.sketch.create({ id: pid, planeId: topPlane?.id })).result
  console.log('[20B] sketch with Top plane:', skPlane)

  const rectB = (await api.v1.sketch.rectangle({
    id: skPlane, startPos: [0, 0, 0], endPos: [60, 40, 0],
  })).result
  const dimB = (await api.v1.sketch.dimension({ id: skPlane, type: 'OFFSET', geomIds: [rectB[0]] })).result
  const updB = await api.v1.sketch.updateDimension({ id: dimB, value: 100 })
  const ptsB = (await api.v1.sketch.getPoints({ id: rectB[0] })).result
  const posB = (await api.v1.sketch.getPositions({ id: ptsB.endId })).result
  console.log('[20B] WITH PLANE — updateDim result=%d, endPos=(%s,%s)',
    updB.result, posB.pos.x, posB.pos.y)

  // ====== TEST C: Sketch created via part.sketch (which may set plane differently) ======
  const skPart = (await api.v1.part.sketch({ id: pid, planeId: topPlane?.id, name: 'SkViaPartAPI' })).result
  console.log('[20C] sketch via part.sketch:', skPart)

  const rectC = (await api.v1.sketch.rectangle({
    id: skPart, startPos: [0, 0, 0], endPos: [60, 40, 0],
  })).result
  const dimC = (await api.v1.sketch.dimension({ id: skPart, type: 'OFFSET', geomIds: [rectC[0]] })).result
  const updC = await api.v1.sketch.updateDimension({ id: dimC, value: 100 })
  const ptsC = (await api.v1.sketch.getPoints({ id: rectC[0] })).result
  const posC = (await api.v1.sketch.getPositions({ id: ptsC.endId })).result
  console.log('[20C] part.sketch — updateDim result=%d, endPos=(%s,%s)',
    updC.result, posC.pos.x, posC.pos.y)

  // ====== TEST D: With plane + COINCIDENT constraint ======
  const skD = (await api.v1.sketch.create({ id: pid, planeId: topPlane?.id })).result
  const noGen = { genFixation: false, genVertAndHoriz: false, genIncidence: false }
  const l1 = (await api.v1.sketch.line({
    id: skD, startPos: [0, 0, 0], endPos: [40, 0, 0], ...noGen,
  })).result
  const l2 = (await api.v1.sketch.line({
    id: skD, startPos: [50, 10, 0], endPos: [90, 10, 0], ...noGen,
  })).result
  const p1 = (await api.v1.sketch.getPoints({ id: l1 })).result
  const p2 = (await api.v1.sketch.getPoints({ id: l2 })).result

  const beforeD = (await api.v1.sketch.getPositions({ id: p2.startId })).result
  await api.v1.sketch.constraint({ id: skD, type: 'COINCIDENT', geomIds: [p1.endId, p2.startId] })
  const afterD = (await api.v1.sketch.getPositions({ id: p2.startId })).result
  console.log('[20D] WITH PLANE + COINCIDENT — before=(%s,%s) after=(%s,%s) moved=%s',
    beforeD.pos.x, beforeD.pos.y, afterD.pos.x, afterD.pos.y,
    beforeD.pos.x !== afterD.pos.x || beforeD.pos.y !== afterD.pos.y)

  // Try updateDimension to trigger solver
  const dimD = (await api.v1.sketch.dimension({ id: skD, type: 'OFFSET', geomIds: [l1] })).result
  const updD = await api.v1.sketch.updateDimension({ id: dimD, value: 40 })
  const afterD2 = (await api.v1.sketch.getPositions({ id: p2.startId })).result
  console.log('[20D] after updateDim — result=%d, l2.start=(%s,%s) moved=%s',
    updD.result, afterD2.pos.x, afterD2.pos.y,
    beforeD.pos.x !== afterD2.pos.x || beforeD.pos.y !== afterD2.pos.y)

  await snapshot('plane-tests')

  filewrite({
    testA: { plane: 'none', solverResult: updA.result, endPos: posA },
    testB: { plane: 'Top', solverResult: updB.result, endPos: posB },
    testC: { plane: 'Top via part.sketch', solverResult: updC.result, endPos: posC },
    testD: { plane: 'Top', coincident: true, movedAfterConstraint: beforeD.pos.x !== afterD.pos.x,
             movedAfterDimUpdate: beforeD.pos.x !== afterD2.pos.x },
  }, 'plane-test-results')

  return { partId: pid }
}
