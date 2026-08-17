// Script 18: Compare auto-constraint (genIncidence) vs manual constraint
// Question 1: Does genIncidence=true at creation time actually merge coincident points?
// Question 2: Does the solver run when constraints are created alongside geometry?
// Question 3: What if we constrain during creation (co-located endpoints)?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const noGen = { genFixation: false, genVertAndHoriz: false, genIncidence: false, genTangency: false }

  // ====== TEST A: genIncidence=true with matching endpoints ======
  // l1 ends at (40,0), l2 starts at (40,0) — same point, genIncidence=true
  const l1a = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0],
    genFixation: false, genVertAndHoriz: false, genIncidence: true,
  })).result
  const l2a = (await api.v1.sketch.line({
    id: skId, startPos: [40, 0, 0], endPos: [80, 20, 0],
    genFixation: false, genVertAndHoriz: false, genIncidence: true,
  })).result

  const pts1a = (await api.v1.sketch.getPoints({ id: l1a })).result
  const pts2a = (await api.v1.sketch.getPoints({ id: l2a })).result
  const p1aEnd = (await api.v1.sketch.getPositions({ id: pts1a.endId })).result
  const p2aStart = (await api.v1.sketch.getPositions({ id: pts2a.startId })).result
  console.log('[18A] genIncidence=true, co-located:')
  console.log('  l1.endId=%d at (%s,%s) | l2.startId=%d at (%s,%s)',
    pts1a.endId, p1aEnd.pos.x, p1aEnd.pos.y,
    pts2a.startId, p2aStart.pos.x, p2aStart.pos.y)
  console.log('  SAME point ID?', pts1a.endId === pts2a.startId)

  // ====== TEST B: genIncidence=false, then manual COINCIDENT, then updateDimension ======
  // l3 and l4 are NOT co-located (10 units gap), no auto-constraints
  const l3 = (await api.v1.sketch.line({
    id: skId, startPos: [0, -40, 0], endPos: [40, -40, 0], ...noGen,
  })).result
  const l4 = (await api.v1.sketch.line({
    id: skId, startPos: [50, -30, 0], endPos: [90, -30, 0], ...noGen,
  })).result

  const pts3 = (await api.v1.sketch.getPoints({ id: l3 })).result
  const pts4 = (await api.v1.sketch.getPoints({ id: l4 })).result

  // Add coincident + dimension, then updateDimension to trigger solver
  const coinc = (await api.v1.sketch.constraint({
    id: skId, type: 'COINCIDENT', geomIds: [pts3.endId, pts4.startId],
  })).result
  console.log('[18B] COINCIDENT constraint:', coinc)

  // Add a dimension on l3 and update it — docs say updateDimension "recalculates the sketch"
  const dim = (await api.v1.sketch.dimension({
    id: skId, type: 'OFFSET', geomIds: [l3],
  })).result
  const updR = await api.v1.sketch.updateDimension({ id: dim, value: 40 })
  console.log('[18B] updateDimension result:', updR.result, '(0=unsolved, 1=solved)')

  const p3End = (await api.v1.sketch.getPositions({ id: pts3.endId })).result
  const p4Start = (await api.v1.sketch.getPositions({ id: pts4.startId })).result
  console.log('[18B] after updateDimension: l3.end=(%s,%s)  l4.start=(%s,%s)  match=%s',
    p3End.pos.x, p3End.pos.y, p4Start.pos.x, p4Start.pos.y,
    p3End.pos.x === p4Start.pos.x && p3End.pos.y === p4Start.pos.y)

  // ====== TEST C: What does moveGeometry actually return for solved state? ======
  // Move l4 such that l4.start lands on l3.end (manual positioning)
  await api.v1.sketch.updateGeometry({
    id: skId,
    lines: [{ id: l4, startPos: [40, -40, 0], endPos: [80, -40, 0] }],
  })
  const moveR = await api.v1.sketch.moveGeometry({
    id: skId, geomIds: [l3, l4], translation: [0, 0, 0],
  })
  console.log('[18C] after manual position fix + moveGeo(0): result=%d (solved?)', moveR.result)

  const p3EndC = (await api.v1.sketch.getPositions({ id: pts3.endId })).result
  const p4StartC = (await api.v1.sketch.getPositions({ id: pts4.startId })).result
  console.log('[18C] l3.end=(%s,%s)  l4.start=(%s,%s)  match=%s',
    p3EndC.pos.x, p3EndC.pos.y, p4StartC.pos.x, p4StartC.pos.y,
    p3EndC.pos.x === p4StartC.pos.x && p3EndC.pos.y === p4StartC.pos.y)

  await snapshot('compare')

  filewrite({
    testA: { genIncidence: true, samePointId: pts1a.endId === pts2a.startId, pts1a, pts2a },
    testB: { manualCoinc: coinc, solverResult: updR.result, afterDim: { p3End, p4Start } },
    testC: { moveResult: moveR.result, afterManualFix: { p3EndC, p4StartC } },
  }, 'gen-vs-manual')

  return { partId }
}
