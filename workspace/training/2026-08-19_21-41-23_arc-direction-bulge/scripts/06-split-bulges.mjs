// 06 — sub-arc bulges after preTrim: does the reconstruction math from
// constrained-sketching (θ=4·atan(bulge), R=|s−e|/(2 sin(θ/2)), center = chordMid +
// R·cos(θ/2)·leftNormal(chord dir), sign-aware) recover the source circle for EVERY
// staged segment? Case A: circle + chord line (2 arcs). Case B: circle crossed by a
// line AND a second circle (4 arcs on the first circle).
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitBulge' })).result
  const partR = await api.v1.common.recalc()
  const top = Object.values(partR.structure.tree).find((n) => n.class === 'CC_WorkPlane' && n.name === 'Top')

  // reconstruct circle from a staged arc node: endpoints + signed bulge
  const reconstruct = (s, e, bulge) => {
    const theta = 4 * Math.atan(bulge) // signed sweep
    const chord = Math.hypot(e.x - s.x, e.y - s.y)
    const R = Math.abs(chord / (2 * Math.sin(theta / 2)))
    const mid = { x: (s.x + e.x) / 2, y: (s.y + e.y) / 2 }
    // left normal of s→e direction
    const d = { x: (e.x - s.x) / chord, y: (e.y - s.y) / chord }
    const ln = { x: -d.y, y: d.x }
    // center = chordMid + ln·h with h = (chord/2)/tan(θ/2) — signed θ makes this
    // universal (minor/major, CW/CCW): tan flips sign exactly when the center
    // switches sides. (First run used mid − ln·h and mislocated 3/4 centers.)
    const h = chord / 2 / Math.tan(theta / 2)
    const center = { x: mid.x + ln.x * h, y: mid.y + ln.y * h }
    return { theta: (theta * 180) / Math.PI, R, center }
  }

  const runCase = async (label, build) => {
    const skId = (await api.v1.sketch.create({ id: partId, planeId: top.id })).result
    const circleId = await build(skId)
    const pre = await api.v1.sketch.preTrim({ id: skId })
    const split = pre.result || []
    const forCircle = split.find((s) => s.sourceId === circleId)
    const segs = forCircle?.splittedCurves || []
    console.log(`[06 ${label}] circle ${circleId} split into ${segs.length} segments`)
    const rows = []
    for (const seg of segs) {
      const node = pre.structure?.tree?.[String(seg.id)]
      const bulge = node?.members?.bulge?.value
      const p = (await api.v1.sketch.getPositions({ id: seg.id })).result
      if (!p || bulge === undefined) {
        rows.push({ id: seg.id, interval: seg.interval, bulge, noData: true })
        console.log(`[06 ${label}] seg ${seg.id} interval ${JSON.stringify(seg.interval)} bulge ${bulge} — MISSING DATA`)
        continue
      }
      const rec = reconstruct(p.startPos, p.endPos, bulge)
      const centerErr = Math.hypot(rec.center.x - 0, rec.center.y - 0)
      const rErr = Math.abs(rec.R - 10)
      rows.push({ id: seg.id, interval: seg.interval, bulge, start: p.startPos, end: p.endPos, rec, centerErr, rErr })
      console.log(
        `[06 ${label}] seg ${seg.id} bulge ${bulge.toFixed(5)} θ ${rec.theta.toFixed(1)}° R ${rec.R.toFixed(4)} center (${rec.center.x.toFixed(4)},${rec.center.y.toFixed(4)}) → centerErr ${centerErr.toExponential(1)} rErr ${rErr.toExponential(1)} ${centerErr < 1e-6 && rErr < 1e-6 ? '✓' : '❌'}`,
      )
    }
    await api.v1.sketch.postTrim({ id: skId }) // no trims marked → restore
    return rows
  }

  // Case A: circle r=10 + horizontal chord at y=0 (line overhangs)
  const caseA = await runCase('A: circle+line', async (skId) => {
    const c = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 10, genFixation: false })).result
    await api.v1.sketch.line({
      id: skId,
      startPos: [-15, 0, 0],
      endPos: [15, 0, 0],
      genFixation: false,
      genIncidence: false,
      genVertAndHoriz: false,
    })
    return c
  })

  // Case B: circle r=10 + vertical line + second circle crossing it (4 splits)
  const caseB = await runCase('B: circle+line+circle', async (skId) => {
    const c = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 10, genFixation: false })).result
    await api.v1.sketch.line({
      id: skId,
      startPos: [0, -15, 0],
      endPos: [0, 15, 0],
      genFixation: false,
      genIncidence: false,
      genVertAndHoriz: false,
    })
    await api.v1.sketch.circle({ id: skId, centerPos: [12, 0, 0], radius: 8, genFixation: false })
    return c
  })

  // Case C: near-tangent chord high on the circle → one SMALL + one MAJOR (>180°)
  // sub-arc — the case where an even-in-θ center formula (R·cos(θ/2)) breaks.
  const caseC = await runCase('C: major sub-arc', async (skId) => {
    const c = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 10, genFixation: false })).result
    await api.v1.sketch.line({
      id: skId,
      startPos: [-15, 8, 0],
      endPos: [15, 8, 0],
      genFixation: false,
      genIncidence: false,
      genVertAndHoriz: false,
    })
    return c
  })

  filewrite({ caseA, caseB, caseC }, 'splits')
  return { aCount: caseA.length, bCount: caseB.length, cCount: caseC.length }
}
