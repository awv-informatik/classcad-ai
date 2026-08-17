// Script 08 — Build profile arcs using CENTER + ANGLE directly so radii are exact.
// Each arc endpoint computed as center + r * (cos θ, sin θ) — guaranteed on circle.
// All 6 profile arcs + inner full circles.

export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'Exercise' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  const noGen = { genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false }
  const deg = a => (a * Math.PI) / 180
  const rad = d => (d * 180) / Math.PI

  // Precise R20c via Newton (many iters for machine precision)
  function solveR20() {
    const A = 60 * Math.sqrt(3)
    let cy = -21.54
    for (let i = 0; i < 200; i++) {
      const cx = (5264 - 112 * cy) / A
      const f = cx * cx + (cy + 26) * (cy + 26) - 5476
      const fp = 2 * cx * (-112 / A) + 2 * (cy + 26)
      const delta = f / fp
      cy -= delta
      if (Math.abs(delta) < 1e-15) break
    }
    return { cx: (5264 - 112 * cy) / A, cy }
  }
  const R20c = solveR20()
  const R36c = { x: 60 * Math.cos(deg(30)), y: 60 * Math.sin(deg(30)) }
  const R54c = { x: 0, y: -26 }

  // Verify distances — these drive tangent correctness
  const d36_20 = Math.hypot(R20c.cx - R36c.x, R20c.cy - R36c.y)
  const d54_20 = Math.hypot(R20c.cx - R54c.x, R20c.cy - R54c.y)
  console.log('[08] d(R36,R20):', d36_20, 'd(R54,R20):', d54_20)

  // Tangent angles
  // R96 arc: from 150° CCW to 30° (i.e., the 120° top arc goes from 30° → 90° → 150° CCW)
  // When building: pick start=(-83.14,48), end=(83.14,48), CCW through (0,96), so isClockwise=false
  const a_R96_start = 150 // left endpoint
  const a_R96_end = 30    // right endpoint (CCW from 150 back to 30 goes thru 90, sweep 240° — not right)
  // Instead, CCW from 30° to 150° goes through 90° (top). That's 120° sweep.
  // For arcByCenter, let start=R96_R (at 30°), end=R96_L (at 150°), isClockwise=false
  // (from start to end going CCW sweeps 120°)

  // R36R arc: from angle 30° (toward origin from R36c gives R96 tangent) CW to angle (toward R20c)
  const a_R36R_start = 30
  const a_R36R_end = rad(Math.atan2(R20c.cy - R36c.y, R20c.cx - R36c.x)) // toward R20c
  // R36L: mirror
  const a_R36L_start = 150
  const a_R36L_end = rad(Math.atan2(R20c.cy - R36c.y, -R20c.cx - (-R36c.x))) // toward -R20c (left)

  // R20R arc: from angle (toward R36c) to angle (toward R54c), at R20c
  const a_R20R_start = rad(Math.atan2(R36c.y - R20c.cy, R36c.x - R20c.cx))
  const a_R20R_end = rad(Math.atan2(R54c.y - R20c.cy, R54c.x - R20c.cx))
  // R20L: mirror
  const a_R20L_start = rad(Math.atan2(R36c.y - R20c.cy, -R36c.x - (-R20c.cx)))
  const a_R20L_end = rad(Math.atan2(R54c.y - R20c.cy, -R54c.x - (-R20c.cx)))

  // R54 arc: from angle (toward R20R) to angle (toward R20L), going CW around bottom
  const a_R54_start = rad(Math.atan2(R20c.cy - R54c.y, R20c.cx - R54c.x))
  const a_R54_end = rad(Math.atan2(R20c.cy - R54c.y, -R20c.cx - R54c.x))

  console.log('[08] angles:')
  console.log('  R96: 30° → 150° CCW')
  console.log('  R36R: 30° → ', a_R36R_end.toFixed(3))
  console.log('  R20R: ', a_R20R_start.toFixed(3), ' → ', a_R20R_end.toFixed(3))
  console.log('  R54: ', a_R54_start.toFixed(3), ' → ', a_R54_end.toFixed(3))

  // Helper: build endpoint
  const endpoint = (cx, cy, r, aDeg) => [cx + r * Math.cos(deg(aDeg)), cy + r * Math.sin(deg(aDeg)), 0]

  // ── Place outer profile as arcs ──
  const arcs = [
    // R96 dome: 30° to 150° CCW
    { label: 'R96', startPos: endpoint(0, 0, 96, 30), endPos: endpoint(0, 0, 96, 150), centerPos: [0, 0, 0], isClockwise: false },
    // R36R: 30° to a_R36R_end (~-67°) CW
    { label: 'R36R', startPos: endpoint(R36c.x, R36c.y, 36, 30), endPos: endpoint(R36c.x, R36c.y, 36, a_R36R_end), centerPos: [R36c.x, R36c.y, 0], isClockwise: true },
    // R20R concave: a_R20R_start (~113°) to a_R20R_end (~183°) CCW
    { label: 'R20R', startPos: endpoint(R20c.cx, R20c.cy, 20, a_R20R_start), endPos: endpoint(R20c.cx, R20c.cy, 20, a_R20R_end), centerPos: [R20c.cx, R20c.cy, 0], isClockwise: false },
    // R54: a_R54_start (~3.5°) to a_R54_end (~176.5°) CW (through bottom)
    { label: 'R54', startPos: endpoint(0, -26, 54, a_R54_start), endPos: endpoint(0, -26, 54, a_R54_end), centerPos: [0, -26, 0], isClockwise: true },
    // R20L: mirror of R20R
    { label: 'R20L', startPos: endpoint(-R20c.cx, R20c.cy, 20, 180 - a_R20R_end), endPos: endpoint(-R20c.cx, R20c.cy, 20, 180 - a_R20R_start), centerPos: [-R20c.cx, R20c.cy, 0], isClockwise: false },
    // R36L: mirror of R36R (150° to 180 - a_R36R_end)
    { label: 'R36L', startPos: endpoint(-R36c.x, R36c.y, 36, 180 - a_R36R_end), endPos: endpoint(-R36c.x, R36c.y, 36, 150), centerPos: [-R36c.x, R36c.y, 0], isClockwise: true },
  ]

  const arcIds = []
  for (const a of arcs) {
    const r = await api.v1.sketch.arcByCenter({
      id: skId,
      startPos: a.startPos, endPos: a.endPos, centerPos: a.centerPos,
      isClockwise: a.isClockwise, ...noGen,
    })
    console.log('[08]', a.label, '→', r.result, 'level:', r.maxLevel, 'msg:', r.messages?.[0]?.message ?? '')
    arcIds.push({ label: a.label, id: r.result })
  }

  // ── Inner features (full circles) ──
  const mk = async (cx, cy, r) =>
    (await api.v1.sketch.circle({ id: skId, centerPos: [cx, cy, 0], radius: r, ...noGen })).result
  const hub50 = await mk(0, 0, 25)
  const hub_inner = await mk(0, 0, 15)
  const h_right = await mk(64 * Math.cos(deg(30)), 64 * Math.sin(deg(30)), 15)
  const h_top   = await mk(0, 64, 15)
  const h_left  = await mk(64 * Math.cos(deg(150)), 64 * Math.sin(deg(150)), 15)
  const Phi40 = await mk(0, -26, 20)
  const R35   = await mk(0, -26, 35)

  await snapshot('08-profile-arcs')
  return { skId, arcIds }
}
