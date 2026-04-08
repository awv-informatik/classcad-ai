// midPos role: does it need to be exactly on the arc, or just define curvature direction?
// Create arcs with different midPos values on same start/end
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MidTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Arc with midPos exactly on the semicircle (radius=20, center at (20,0,0))
  // Point on circle at 90°: (20, 20, 0)
  const r1 = await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [0, 0, 0],
    midPos: [20, 20, 0],
    endPos: [40, 0, 0],
  })
  const pos1 = (await api.v1.sketch.getPositions({ id: r1.result })).result
  console.log('[12] Arc1 center:', JSON.stringify(pos1.centerPos))

  // Same start/end but midPos at a different height — defines a different circle
  const r2 = await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [0, -50, 0],
    midPos: [20, -40, 0],  // lower curvature
    endPos: [40, -50, 0],
  })
  const pos2 = (await api.v1.sketch.getPositions({ id: r2.result })).result
  console.log('[12] Arc2 center:', JSON.stringify(pos2.centerPos))

  // Same start/end but midPos below — curves downward
  const r3 = await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [0, -100, 0],
    midPos: [20, -120, 0],  // curves down
    endPos: [40, -100, 0],
  })
  const pos3 = (await api.v1.sketch.getPositions({ id: r3.result })).result
  console.log('[12] Arc3 center:', JSON.stringify(pos3.centerPos))

  filewrite({
    arc1: { id: r1.result, centerPos: pos1.centerPos },
    arc2: { id: r2.result, centerPos: pos2.centerPos },
    arc3: { id: r3.result, centerPos: pos3.centerPos },
  }, 'midpos-comparison')

  await snapshot('midpos-variations')
  return { partId }
}
