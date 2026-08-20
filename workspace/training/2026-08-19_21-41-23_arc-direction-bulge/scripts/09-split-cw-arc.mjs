// 09 — split a CW-created arc: do staged sub-arcs inherit the parent's direction
// (negative bulges) or get normalized to CCW like circle sub-arcs (all positive in 06)?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitCwArc' })).result
  const partR = await api.v1.common.recalc()
  const top = Object.values(partR.structure.tree).find((n) => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: top.id })).result

  // major CW arc (10,0)→(0,10), c origin, r=10, bulge −2.4142 (spans 0°→−270°)
  const arc = (
    await api.v1.sketch.arcByCenter({
      id: skId,
      startPos: [10, 0, 0],
      endPos: [0, 10, 0],
      centerPos: [0, 0, 0],
      isClockwise: true,
      genFixation: false,
      genIncidence: false,
    })
  ).result
  const rc = await api.v1.common.recalc()
  console.log('[09] parent bulge', rc.structure?.tree?.[String(arc)]?.members?.bulge?.value)

  // vertical line crossing the arc interior at (0,−10); (0,10) is an endpoint
  await api.v1.sketch.line({
    id: skId,
    startPos: [0, -15, 0],
    endPos: [0, 15, 0],
    genFixation: false,
    genIncidence: false,
    genVertAndHoriz: false,
  })

  const pre = await api.v1.sketch.preTrim({ id: skId })
  const forArc = (pre.result || []).find((s) => s.sourceId === arc)
  const segs = forArc?.splittedCurves || []
  console.log('[09] split into', segs.length, 'segments')
  const rows = []
  for (const seg of segs) {
    const bulge = pre.structure?.tree?.[String(seg.id)]?.members?.bulge?.value
    const p = (await api.v1.sketch.getPositions({ id: seg.id })).result
    const theta = 4 * Math.atan(bulge)
    rows.push({ id: seg.id, interval: seg.interval, bulge, start: p?.startPos, end: p?.endPos, thetaDeg: (theta * 180) / Math.PI })
    console.log(
      `[09] seg ${seg.id} bulge ${bulge?.toFixed(5)} θ ${((theta * 180) / Math.PI).toFixed(1)}° start (${p?.startPos.x.toFixed(2)},${p?.startPos.y.toFixed(2)}) end (${p?.endPos.x.toFixed(2)},${p?.endPos.y.toFixed(2)})`,
    )
  }
  await api.v1.sketch.postTrim({ id: skId })
  filewrite(rows, 'cw-splits')
  return rows.map((r) => ({ bulge: r.bulge, thetaDeg: r.thetaDeg }))
}
