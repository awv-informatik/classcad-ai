// Script 05 — Draw only the outer profile as arcs (no circles) to verify shape.
// Chain CW around the right side: R96 → R36R → R20R → R54 → R20L → R36L → back to R96.

export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'Exercise' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  const noGen = { genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false }
  const deg = a => (a * Math.PI) / 180

  // Tangent points
  const R96end_R = [96 * Math.cos(deg(30)), 96 * Math.sin(deg(30)), 0]     // (83.14, 48)
  const R96end_L = [-96 * Math.cos(deg(30)), 96 * Math.sin(deg(30)), 0]

  const R36c_R = [60 * Math.cos(deg(30)), 60 * Math.sin(deg(30)), 0]       // (51.96, 30)
  const R36c_L = [-60 * Math.cos(deg(30)), 60 * Math.sin(deg(30)), 0]

  const R20c_R = [73.87, -21.54, 0]
  const R20c_L = [-73.87, -21.54, 0]

  const R54c = [0, -26, 0]

  // R36 ↔ R20 tangent points (right side): on line R36c_R → R20c_R, at R36 distance from R36c_R
  const d_36_20 = 56
  const vxR = (R20c_R[0] - R36c_R[0]) / d_36_20
  const vyR = (R20c_R[1] - R36c_R[1]) / d_36_20
  const tp_36_20_R = [R36c_R[0] + 36 * vxR, R36c_R[1] + 36 * vyR, 0]
  const tp_36_20_L = [-tp_36_20_R[0], tp_36_20_R[1], 0]

  // R20 ↔ R54 tangent points (right side): on line R54c → R20c_R, at R54 distance from R54c
  const d_54_20 = 74
  const uxR = (R20c_R[0] - R54c[0]) / d_54_20
  const uyR = (R20c_R[1] - R54c[1]) / d_54_20
  const tp_54_20_R = [R54c[0] + 54 * uxR, R54c[1] + 54 * uyR, 0]
  const tp_54_20_L = [-tp_54_20_R[0], tp_54_20_R[1], 0]

  console.log('[05] R96 endpoint R:', R96end_R)
  console.log('[05] R36 ↔ R20 tangent point R:', tp_36_20_R)
  console.log('[05] R20 ↔ R54 tangent point R:', tp_54_20_R)

  // Build arcs. arcByCenter: startPos, endPos, centerPos, isClockwise
  const arcs = [
    // R96 dome: from R96end_L over top to R96end_R, CCW (through (0,96))
    { startPos: R96end_L, endPos: R96end_R, centerPos: [0, 0, 0], isClockwise: false },
    // R36R: from R96end_R to tp_36_20_R, CW (short way)
    { startPos: R96end_R, endPos: tp_36_20_R, centerPos: R36c_R, isClockwise: true },
    // R20R concave: from tp_36_20_R to tp_54_20_R, CCW (short way, body-facing side of R20)
    { startPos: tp_36_20_R, endPos: tp_54_20_R, centerPos: R20c_R, isClockwise: false },
    // R54: from tp_54_20_R around bottom to tp_54_20_L, CW (through (0,-80))
    { startPos: tp_54_20_R, endPos: tp_54_20_L, centerPos: R54c, isClockwise: true },
    // R20L concave: from tp_54_20_L to tp_36_20_L, CCW
    { startPos: tp_54_20_L, endPos: tp_36_20_L, centerPos: R20c_L, isClockwise: false },
    // R36L: from tp_36_20_L up to R96end_L, CW
    { startPos: tp_36_20_L, endPos: R96end_L, centerPos: R36c_L, isClockwise: true },
  ]

  const arcIds = []
  for (const a of arcs) {
    const r = await api.v1.sketch.arcByCenter({ id: skId, ...a, ...noGen })
    console.log('[05] arc:', a.centerPos, '→', r.result, 'msg:', r.maxLevel)
    arcIds.push(r.result)
  }

  await snapshot('05-outer-profile')
  return { skId, arcIds }
}
