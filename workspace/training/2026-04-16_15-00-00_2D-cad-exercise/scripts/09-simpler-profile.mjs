// Script 09 — Simpler outer profile: R96 dome + R20 waist concave + R54 bottom. No R36 arms.
// Test hypothesis: R36 is NOT body arm, but an inner/slot feature.
// R20 tangent: internal to R96 (R20 inside R96's disk, d=76), external to R54 (d=74).

export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'Exercise' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  const noGen = { genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false }
  const deg = a => (a * Math.PI) / 180
  const rad = d => (d * 180) / Math.PI

  // R20 solve: d(R20,R96)=76 internal, d(R20,R54(0,-26))=74 external
  // cx² + cy² = 5776
  // cx² + (cy+26)² = 5476
  // Subtract: 52cy + 676 = -300 → cy = -18.769, cx² = 5776 - 352.28 = 5423.72 → cx = 73.645
  const cy = -300 / 52 - 676 / 52
  const cy_exact = -976 / 52 // = -18.7692...
  const cx_exact = Math.sqrt(5776 - cy_exact * cy_exact)
  console.log('[09] R20c exact:', { cx: cx_exact, cy: cy_exact })
  const R20c = { cx: cx_exact, cy: cy_exact }
  const R54c = { x: 0, y: -26 }

  // Verify
  const d_R96 = Math.hypot(R20c.cx, R20c.cy)
  const d_R54 = Math.hypot(R20c.cx, R20c.cy - R54c.y)
  console.log('[09] d(R20,origin):', d_R96, '(want 76)', 'd(R20,R54c):', d_R54, '(want 74)')

  // Tangent angles
  // R20c at angle from origin: atan2(cy, cx)
  const ang_R20R_at_origin = rad(Math.atan2(R20c.cy, R20c.cx))   // ~-14.3°
  const ang_R20L_at_origin = rad(Math.atan2(R20c.cy, -R20c.cx))  // ~194.3°
  // R20 → origin tangent at R96 at angle ang_R20R_at_origin, pos = (96 cos α, 96 sin α)
  const tp_R96_R = [96 * Math.cos(deg(ang_R20R_at_origin)), 96 * Math.sin(deg(ang_R20R_at_origin)), 0]
  const tp_R96_L = [96 * Math.cos(deg(ang_R20L_at_origin)), 96 * Math.sin(deg(ang_R20L_at_origin)), 0]

  // R20 → R54 tangent at angle of (R20c - R54c), at R54 boundary
  const ang_R20R_at_R54 = rad(Math.atan2(R20c.cy - R54c.y, R20c.cx - R54c.x))  // ~3.45°
  const ang_R20L_at_R54 = rad(Math.atan2(R20c.cy - R54c.y, -R20c.cx - R54c.x)) // ~176.55°
  const tp_R54_R = [R54c.x + 54 * Math.cos(deg(ang_R20R_at_R54)), R54c.y + 54 * Math.sin(deg(ang_R20R_at_R54)), 0]
  const tp_R54_L = [R54c.x + 54 * Math.cos(deg(ang_R20L_at_R54)), R54c.y + 54 * Math.sin(deg(ang_R20L_at_R54)), 0]

  // R20 arc tangent angles (at R20c)
  const ang_R20R_to_R96 = rad(Math.atan2(0 - R20c.cy, 0 - R20c.cx))       // toward origin; =180°+ang_R20R_at_origin
  const ang_R20R_to_R54 = rad(Math.atan2(R54c.y - R20c.cy, R54c.x - R20c.cx)) // toward R54c
  const tp_R20R_R96 = [R20c.cx + 20 * Math.cos(deg(ang_R20R_to_R96)), R20c.cy + 20 * Math.sin(deg(ang_R20R_to_R96)), 0]
  const tp_R20R_R54 = [R20c.cx + 20 * Math.cos(deg(ang_R20R_to_R54)), R20c.cy + 20 * Math.sin(deg(ang_R20R_to_R54)), 0]

  console.log('[09] tp_R96_R:', tp_R96_R, ' == tp_R20R_R96:', tp_R20R_R96)
  console.log('[09] tp_R54_R:', tp_R54_R, ' == tp_R20R_R54:', tp_R20R_R54)

  // Build arcs
  const arcs = [
    // R96 arc from tp_R96_L over top to tp_R96_R, CCW (through (0, 96))
    { label: 'R96', startPos: tp_R96_L, endPos: tp_R96_R, centerPos: [0, 0, 0], isClockwise: false },
    // R20R concave from tp_R20R_R96 to tp_R20R_R54 CCW (body-facing)
    { label: 'R20R', startPos: tp_R20R_R96, endPos: tp_R20R_R54, centerPos: [R20c.cx, R20c.cy, 0], isClockwise: false },
    // R54 from tp_R54_R CW through bottom to tp_R54_L
    { label: 'R54', startPos: tp_R54_R, endPos: tp_R54_L, centerPos: [R54c.x, R54c.y, 0], isClockwise: true },
    // R20L mirror
    { label: 'R20L', startPos: [R20c.cx * -1 + 20 * Math.cos(deg(ang_R20R_to_R54)) * -1, R20c.cy + 20 * Math.sin(deg(ang_R20R_to_R54)), 0],
      endPos: [-R20c.cx + 20 * Math.cos(deg(ang_R20R_to_R96)) * -1, R20c.cy + 20 * Math.sin(deg(ang_R20R_to_R96)), 0],
      centerPos: [-R20c.cx, R20c.cy, 0], isClockwise: false },
  ]

  const arcIds = []
  for (const a of arcs) {
    const r = await api.v1.sketch.arcByCenter({
      id: skId,
      startPos: a.startPos, endPos: a.endPos, centerPos: a.centerPos,
      isClockwise: a.isClockwise, ...noGen,
    })
    console.log('[09]', a.label, '→', r.result, 'level:', r.maxLevel, 'msg:', r.messages?.[0]?.message ?? '')
    arcIds.push({ label: a.label, id: r.result })
  }

  // Inner features
  const mk = async (cx, cy, r) =>
    (await api.v1.sketch.circle({ id: skId, centerPos: [cx, cy, 0], radius: r, ...noGen })).result
  await mk(0, 0, 25)  // hub50
  await mk(0, 0, 15)  // hub_inner
  await mk(64 * Math.cos(deg(30)), 64 * Math.sin(deg(30)), 15)
  await mk(0, 64, 15)
  await mk(64 * Math.cos(deg(150)), 64 * Math.sin(deg(150)), 15)
  await mk(0, -26, 20)  // Ø40
  await mk(0, -26, 35)  // R35

  await snapshot('09-simpler-profile')
  return { skId, arcIds }
}
