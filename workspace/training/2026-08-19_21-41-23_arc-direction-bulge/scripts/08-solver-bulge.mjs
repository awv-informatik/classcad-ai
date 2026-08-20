// 08 — solver re-solve vs bulge consistency: a constrained tangent-junction profile
// (line + arc, COINCIDENT + TANGENT + RADIUS dim), re-dimension the radius, then
// check the tree bulge against exact positions after the re-solve.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SolverBulge' })).result
  const partR = await api.v1.common.recalc()
  const top = Object.values(partR.structure.tree).find((n) => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: top.id })).result

  // baseline: horizontal line (0,0)→(10,0), then a CCW quarter arc (10,0)→(20,10) c=(10,10)? r=10:
  // |s−c|=10 ✓, |e−c|=10 ✓. CCW from angle −90° to 0° → passes −45° → bulge +tan(22.5°).
  const line = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [10, 0, 0], genFixation: false, genVertAndHoriz: false }))
    .result
  const arc = (
    await api.v1.sketch.arcByCenter({
      id: skId,
      startPos: [10, 0, 0],
      endPos: [20, 10, 0],
      centerPos: [10, 10, 0],
      isClockwise: false,
      genFixation: false,
      genIncidence: true,
    })
  ).result

  const lp = (await api.v1.sketch.getPoints({ id: line })).result
  await api.v1.sketch.constraint([
    { id: skId, type: 'FIXATION', geomIds: [lp.startId] },
    { id: skId, type: 'FIXATION', geomIds: [lp.endId] },
    { id: skId, type: 'TANGENT', geomIds: [line, arc] },
  ])
  const dim = (await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [arc], value: 10 })).result
  const read = async (label) => {
    const rc = await api.v1.common.recalc()
    const node = rc.structure?.tree?.[String(arc)]
    const bulge = node?.members?.bulge?.value
    const p = (await api.v1.sketch.getPositions({ id: arc })).result
    // consistency: reconstruct R from positions+bulge, compare with |start−center| readback
    const s = p.startPos,
      e = p.endPos,
      c = p.centerPos
    const chord = Math.hypot(e.x - s.x, e.y - s.y)
    const theta = 4 * Math.atan(bulge)
    const Rrec = Math.abs(chord / (2 * Math.sin(theta / 2)))
    const Rpos = Math.hypot(s.x - c.x, s.y - c.y)
    console.log(
      `[08 ${label}] bulge ${bulge?.toFixed(6)} θ ${((theta * 180) / Math.PI).toFixed(2)}° R(bulge) ${Rrec.toFixed(6)} R(positions) ${Rpos.toFixed(6)} Δ ${Math.abs(Rrec - Rpos).toExponential(2)} ${Math.abs(Rrec - Rpos) < 1e-6 ? '✓' : '❌ STALE BULGE'}`,
    )
    return { bulge, theta, Rrec, Rpos, s, e, c }
  }

  const before = await read('baseline r=10')
  const u1 = await api.v1.sketch.updateDimension({ id: dim, value: 15 })
  console.log('[08] updateDimension r=15 →', u1.result)
  const mid = await read('after r=15')
  const u2 = await api.v1.sketch.updateDimension({ id: dim, value: 6 })
  console.log('[08] updateDimension r=6 →', u2.result)
  const after = await read('after r=6')

  filewrite({ before, mid, after }, 'solver')
  return { before: before.bulge, mid: mid.bulge, after: after.bulge }
}
