// Script 21: Does an explicit plane fix the solver?
// Single part.create, sketch with Top plane, rectangle + dimension change
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'PlaneTest' })
  const pid = partR.result

  // Find standard Top plane from structure tree
  const tree = partR.structure?.tree || {}
  const topPlane = Object.values(tree).find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  console.log('[21] Top plane ID:', topPlane?.id)

  // Sketch WITH explicit plane
  const skId = (await api.v1.sketch.create({ id: pid, planeId: topPlane?.id })).result
  console.log('[21] sketch on Top plane:', skId)

  // Rectangle 60×40
  const rect = (await api.v1.sketch.rectangle({
    id: skId, startPos: [0, 0, 0], endPos: [60, 40, 0],
  })).result

  // Get bottom line endpoints
  const pts = (await api.v1.sketch.getPoints({ id: rect[0] })).result
  const before = (await api.v1.sketch.getPositions({ id: pts.endId })).result
  console.log('[21] BEFORE: bottom line end = (%s, %s)', before.pos.x, before.pos.y)

  await snapshot('before')

  // Dimension on bottom line, then change to 100
  const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rect[0]] })).result
  const updR = await api.v1.sketch.updateDimension({ id: dimId, value: 100 })
  console.log('[21] updateDimension(100): result=%d maxLevel=%d', updR.result, updR.maxLevel)

  const after = (await api.v1.sketch.getPositions({ id: pts.endId })).result
  console.log('[21] AFTER: bottom line end = (%s, %s)', after.pos.x, after.pos.y)
  console.log('[21] MOVED? %s (before x=%d, after x=%d)', before.pos.x !== after.pos.x, before.pos.x, after.pos.x)

  await snapshot('after')

  // Also test COINCIDENT with plane
  const noGen = { genFixation: false, genVertAndHoriz: false, genIncidence: false }
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, -30, 0], endPos: [40, -30, 0], ...noGen })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [50, -20, 0], endPos: [90, -20, 0], ...noGen })).result
  const p1 = (await api.v1.sketch.getPoints({ id: l1 })).result
  const p2 = (await api.v1.sketch.getPoints({ id: l2 })).result

  const coinBefore = (await api.v1.sketch.getPositions({ id: p2.startId })).result
  await api.v1.sketch.constraint({ id: skId, type: 'COINCIDENT', geomIds: [p1.endId, p2.startId] })
  const coinAfter = (await api.v1.sketch.getPositions({ id: p2.startId })).result
  console.log('[21] COINCIDENT with plane: before=(%s,%s) after=(%s,%s) moved=%s',
    coinBefore.pos.x, coinBefore.pos.y, coinAfter.pos.x, coinAfter.pos.y,
    coinBefore.pos.x !== coinAfter.pos.x || coinBefore.pos.y !== coinAfter.pos.y)

  filewrite({
    plane: topPlane?.id,
    dimResize: { before: before.pos, after: after.pos, solverResult: updR.result, moved: before.pos.x !== after.pos.x },
    coincident: { before: coinBefore.pos, after: coinAfter.pos, moved: coinBefore.pos.x !== coinAfter.pos.x },
  }, 'plane-solver-test')

  return { partId: pid }
}
