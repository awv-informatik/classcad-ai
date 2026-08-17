// 08-circles-v2.mjs — Refined: right arm is a slot (like left lobe) at 40°
// R.875 = outer ends, R.438 = inner ends (concentric pairs, like R.750/R.437)
// Arm base center tangent to R1.375 (internal, d = R1.375 - R.875 = 0.500)

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LinkagePlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const noGen = { genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false }
  const PI = Math.PI, cos = Math.cos, sin = Math.sin

  const c = async (cx, cy, r, label) => {
    const id = (await api.v1.sketch.circle({ id: skId, centerPos: [cx, cy, 0], radius: r, ...noGen })).result
    console.log(`[08] ${label}: (${cx.toFixed(3)}, ${cy.toFixed(3)}), r=${r}`)
    return id
  }
  const line = async (a, b) =>
    api.v1.sketch.line({ id: skId, startPos: [...a, 0], endPos: [...b, 0], ...noGen })

  const ang = 40 * PI / 180
  const aD = [cos(ang), sin(ang)]  // arm direction
  const aP = [-sin(ang), cos(ang)] // arm perpendicular

  // ================================================================
  // LEFT OBLONG — 4 circles
  // ================================================================
  await c(0.750, 0.1875, 0.750,  '1. R.750 top')
  await c(0.750, -0.1875, 0.750, '2. R.750 bot')
  await c(0.750, 0.1875, 0.437,  '3. R.437 top')
  await c(0.750, -0.1875, 0.437, '4. R.437 bot')

  // ================================================================
  // UPPER ROUND — 2 circles
  // ================================================================
  await c(1.750, 0.750, 0.8125, '5. Ø1.625')
  await c(1.750, 0.750, 0.375,  '6. Ø0.750')

  // ================================================================
  // MIDDLE ROUND — 3 circles (concentric at (1.750, 0))
  // ================================================================
  await c(1.750, 0, 0.875,  '7. Ø1.750')
  await c(1.750, 0, 0.5625, '8. Ø1.125')
  await c(1.750, 0, 1.750,  '9. R1.750 contour')

  // ================================================================
  // RIGHT ARM OBLONG — 7 circles
  //
  // Structure mirrors the left oblong:
  //   Left: 2× R.750 (outer) + 2× R.437 (inner) at same centers
  //   Right: 2× R.875 (outer) + 2× R.438 (inner) at same centers
  //
  // Arm axis at 40° from R1.375 center (4.062, 0)
  // Base center: d1 along axis (tangent to R1.375)
  // Tip center: d2 along axis (rightmost at x = 5.804)
  // ================================================================

  // R1.375 contour
  await c(4.062, 0, 1.375, '10. R1.375 contour')

  // Arm base: tangent to R1.375 (internal: d = R1.375 - R.875 = 0.500)
  const d1 = 0.500
  const armBase = [4.062 + d1 * aD[0], d1 * aD[1]]

  // Arm tip: rightmost point at x = 5.804 → tip_cx = 5.804 - 0.875 = 4.929
  // Along 40° axis: 4.062 + d2*cos40 = 4.929 → d2 = 1.132
  const d2 = (5.804 - 0.875 - 4.062) / aD[0]
  const armTip = [4.062 + d2 * aD[0], d2 * aD[1]]

  console.log(`[08] Arm base: (${armBase.map(v=>v.toFixed(3))})`)
  console.log(`[08] Arm tip: (${armTip.map(v=>v.toFixed(3))})`)
  console.log(`[08] Arm length between centers: ${(d2-d1).toFixed(3)}`)

  // R.875 (outer) + R.438 (inner) at base and tip
  await c(armBase[0], armBase[1], 0.875, '11. R.875 base')
  await c(armTip[0],  armTip[1],  0.875, '12. R.875 tip')
  await c(armBase[0], armBase[1], 0.438, '13. R.438 base')
  await c(armTip[0],  armTip[1],  0.438, '14. R.438 tip')

  // R.625 transitions — connect the arm to the body contour
  // These should be near the arm base, offset perpendicular to the axis
  // R.625 tangent to R.875 base (external: d = R.625 + R.875 = 1.500)
  // and tangent to R1.750 or R1.375
  // For now, place along the arm perpendicular at the base area
  const fOff = 1.200  // perpendicular offset from arm axis
  const fDist = 0.100 // along axis from base
  const r625_upper = [
    armBase[0] + fDist * aD[0] + fOff * aP[0],
    armBase[1] + fDist * aD[1] + fOff * aP[1]
  ]
  const r625_lower = [
    armBase[0] + fDist * aD[0] - fOff * aP[0],
    armBase[1] + fDist * aD[1] - fOff * aP[1]
  ]

  await c(r625_upper[0], r625_upper[1], 0.625, '15. R.625 upper')
  await c(r625_lower[0], r625_lower[1], 0.625, '16. R.625 lower')

  // ================================================================
  // REFERENCE LINES
  // ================================================================
  await line([-0.5, 0], [6.5, 0])
  await line([1.750, -2.5], [1.750, 2.5])
  await line([0.750, -1.5], [0.750, 1.5])
  // 40° axis through arm
  await line([4.062, 0], [4.062 + 3*aD[0], 3*aD[1]])

  console.log('[08] All 16 circles placed')
  await snapshot('circles-v2')
  return { partId }
}
