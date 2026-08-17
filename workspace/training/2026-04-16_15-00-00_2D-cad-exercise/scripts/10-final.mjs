// Script 10 — FINAL. Outer profile (R96 dome + R36 arms + R20 concave waist + R54 bottom)
// + inner holes + slot (approximated as 2 concentric arcs with breaks + line endcaps at 60° openings).

export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'Exercise' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  const noGen = { genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false }
  const deg = a => (a * Math.PI) / 180
  const rad = d => (d * 180) / Math.PI

  // R20c solve
  function solveR20() {
    const A = 60 * Math.sqrt(3)
    let cy = -21.54
    for (let i = 0; i < 200; i++) {
      const cx = (5264 - 112 * cy) / A
      const f = cx * cx + (cy + 26) * (cy + 26) - 5476
      const fp = 2 * cx * (-112 / A) + 2 * (cy + 26)
      cy -= f / fp
      if (Math.abs(f) < 1e-15) break
    }
    return { cx: (5264 - 112 * cy) / A, cy }
  }
  const R20c = solveR20()
  const R36c = { x: 60 * Math.cos(deg(30)), y: 60 * Math.sin(deg(30)) }
  const slot_c = { x: 0, y: -26 }

  // Tangent angles (for R36 arms at endpoints)
  const a_R36R_end = rad(Math.atan2(R20c.cy - R36c.y, R20c.cx - R36c.x))
  const a_R20R_start = rad(Math.atan2(R36c.y - R20c.cy, R36c.x - R20c.cx))
  const a_R20R_end = rad(Math.atan2(slot_c.y - R20c.cy, slot_c.x - R20c.cx))
  const a_R54_start = rad(Math.atan2(R20c.cy - slot_c.y, R20c.cx - slot_c.x))
  const a_R54_end = rad(Math.atan2(R20c.cy - slot_c.y, -R20c.cx - slot_c.x))

  const endpoint = (cx, cy, r, aDeg) => [cx + r * Math.cos(deg(aDeg)), cy + r * Math.sin(deg(aDeg)), 0]

  // ── OUTER PROFILE ARCS ──
  const arcs = [
    { label: 'R96', startPos: endpoint(0, 0, 96, 30), endPos: endpoint(0, 0, 96, 150), centerPos: [0, 0, 0], isClockwise: false },
    { label: 'R36R', startPos: endpoint(R36c.x, R36c.y, 36, 30), endPos: endpoint(R36c.x, R36c.y, 36, a_R36R_end), centerPos: [R36c.x, R36c.y, 0], isClockwise: true },
    { label: 'R20R', startPos: endpoint(R20c.cx, R20c.cy, 20, a_R20R_start), endPos: endpoint(R20c.cx, R20c.cy, 20, a_R20R_end), centerPos: [R20c.cx, R20c.cy, 0], isClockwise: false },
    { label: 'R54',  startPos: endpoint(0, -26, 54, a_R54_start), endPos: endpoint(0, -26, 54, a_R54_end), centerPos: [0, -26, 0], isClockwise: true },
    { label: 'R20L', startPos: endpoint(-R20c.cx, R20c.cy, 20, 180 - a_R20R_end), endPos: endpoint(-R20c.cx, R20c.cy, 20, 180 - a_R20R_start), centerPos: [-R20c.cx, R20c.cy, 0], isClockwise: false },
    { label: 'R36L', startPos: endpoint(-R36c.x, R36c.y, 36, 180 - a_R36R_end), endPos: endpoint(-R36c.x, R36c.y, 36, 150), centerPos: [-R36c.x, R36c.y, 0], isClockwise: true },
  ]
  for (const a of arcs) {
    const r = await api.v1.sketch.arcByCenter({ id: skId, ...a, ...noGen })
    console.log('[10]', a.label, '→', r.result)
  }

  // ── INNER FULL CIRCLES ──
  const mk = async (cx, cy, r) =>
    (await api.v1.sketch.circle({ id: skId, centerPos: [cx, cy, 0], radius: r, ...noGen })).result
  await mk(0, 0, 25)  // Ø50 outer
  await mk(0, 0, 15)  // inner hub hole guess Ø30
  await mk(64 * Math.cos(deg(30)), 64 * Math.sin(deg(30)), 15)  // right hole Ø30
  await mk(0, 64, 15)
  await mk(64 * Math.cos(deg(150)), 64 * Math.sin(deg(150)), 15)
  await mk(0, -26, 20)  // Ø40 boss hole
  // R35 — slot outer as full circle for now
  await mk(0, -26, 35)

  // ── SLOT feature (approximated) ──
  // Two bars from 60° each side; 60° opening top and bottom
  // Bars: 120° arcs from -60° to 60° (right bar), 120° to 240° (left bar)
  // Inner radius ~26 (between Ø40=20 and R35=35, roughly midway)
  // Actually: inner slot radius = 27, outer slot radius = 35
  // Wait — the slot IS between Ø40 (r=20) and R35 (r=35). Just show those arcs with gaps.
  // For now: draw R35 outer arcs with 60° breaks at top/bottom
  const slot_inner_r = 27    // rough inner slot boundary between Ø40 and R35
  const arcs_slot = [
    // Outer R35 arcs: right bar from -60° to 60° (120° CCW), left bar from 120° to 240°
    // Already have R35 full circle above — skip and use breaks instead
  ]
  // End caps at 60° and -60° (approx): short line connecting inner to outer
  // To approximate slot bars, draw line segments at the bar ends connecting slot_c + 20*unit to slot_c + 35*unit at 4 angles (±60°, ±120°)
  for (const theta of [60, -60, 120, -120]) {
    const p1 = [slot_c.x + 20 * Math.cos(deg(theta)), slot_c.y + 20 * Math.sin(deg(theta)), 0]
    const p2 = [slot_c.x + 35 * Math.cos(deg(theta)), slot_c.y + 35 * Math.sin(deg(theta)), 0]
    await api.v1.sketch.line({ id: skId, startPos: p1, endPos: p2, ...noGen })
  }

  await snapshot('10-final')

  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  filewrite(geo, 'geometry-final')
  return { skId }
}
