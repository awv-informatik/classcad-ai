// Does updateGeometry trigger the constraint solver?
// Test: constrain two lines to PARALLEL, then updateGeometry one of them
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const l1 = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [l1] })
  await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [l1] })

  const l2 = (await api.v1.sketch.line({
    id: skId, startPos: [0, 30, 0], endPos: [60, 50, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result

  // Constrain l2 parallel to l1 (which is fixed horizontal)
  await api.v1.sketch.constraint({ id: skId, type: 'PARALLEL', geomIds: [l1, l2] })

  const l2Before = await getLinePositions(api, l2)
  console.log('[18] l2 BEFORE updateGeometry:', l2Before)

  // updateGeometry: move l2's start point
  const rUG = await api.v1.sketch.updateGeometry({
    id: skId,
    lines: [{ id: l2, startPos: [0, 40, 0], endPos: [60, 50, 0] }],
  })
  console.log('[18] updateGeometry result:', rUG.result, 'maxLevel:', rUG.maxLevel)
  if (rUG.messages?.length) console.log('[18] messages:', JSON.stringify(rUG.messages))

  const l2After = await getLinePositions(api, l2)
  console.log('[18] l2 AFTER updateGeometry:', l2After)

  // Check if l2 is now horizontal (parallel to l1)
  const isHoriz = Math.abs(l2After.start.pos.y - l2After.end.pos.y) < 0.01
  console.log('[18] l2 is horizontal after updateGeometry:', isHoriz)

  // Try a second approach: use dimension to trigger solving?
  // Add a HORIZONTAL constraint on l2 directly
  const rH2 = await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [l2] })
  console.log('[18] additional HORIZONTAL on l2:', rH2.result, 'maxLevel:', rH2.maxLevel)

  const l2After2 = await getLinePositions(api, l2)
  console.log('[18] l2 AFTER additional HORIZONTAL:', l2After2)

  filewrite({
    before: l2Before,
    afterUpdateGeometry: l2After,
    isHorizontalAfterUpdate: isHoriz,
    afterAdditionalHorizontal: l2After2,
    updateGeometryResult: rUG.result,
  }, 'updateGeometry-solver')

  return { partId }
}

async function getLinePositions(api, lineId) {
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  const startPos = (await api.v1.sketch.getPositions({ id: pts.startId })).result
  const endPos = (await api.v1.sketch.getPositions({ id: pts.endId })).result
  return { start: startPos, end: endPos }
}
