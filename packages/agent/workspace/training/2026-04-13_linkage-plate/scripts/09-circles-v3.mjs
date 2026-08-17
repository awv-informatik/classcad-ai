// 09-circles-v3.mjs — R.625 positions solved analytically from tangency
// R.625 upper: tangent to Ø1.625 (ext, d=1.4375) + R.875 base (ext, d=1.500) → (3.149, 1.078)
// R.625 lower: tangent to R1.375 (int, d=0.750) + R.438 base (ext, d=1.063) → (4.259, -0.724)

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LinkagePlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const noGen = { genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false }
  const PI = Math.PI, cos = Math.cos, sin = Math.sin

  const c = async (cx, cy, r, label) => {
    const id = (await api.v1.sketch.circle({ id: skId, centerPos: [cx, cy, 0], radius: r, ...noGen })).result
    console.log(`[09] ${label}: (${cx.toFixed(3)}, ${cy.toFixed(3)}) r=${r}`)
    return id
  }
  const line = async (a, b) =>
    api.v1.sketch.line({ id: skId, startPos: [...a, 0], endPos: [...b, 0], ...noGen })

  const ang = 40 * PI / 180
  const aD = [cos(ang), sin(ang)]

  // ================================================================
  // ALL 16 CIRCLES — computed positions
  // ================================================================

  // LEFT OBLONG (4)
  await c(0.750, 0.1875, 0.750,  '1. R.750 top')
  await c(0.750, -0.1875, 0.750, '2. R.750 bot')
  await c(0.750, 0.1875, 0.437,  '3. R.437 top')
  await c(0.750, -0.1875, 0.437, '4. R.437 bot')

  // UPPER ROUND (2)
  await c(1.750, 0.750, 0.8125, '5. Ø1.625')
  await c(1.750, 0.750, 0.375,  '6. Ø0.750')

  // MIDDLE ROUND (3) — all concentric at (1.750, 0)
  await c(1.750, 0, 0.875,  '7. Ø1.750')
  await c(1.750, 0, 0.5625, '8. Ø1.125')
  await c(1.750, 0, 1.750,  '9. R1.750 contour')

  // R1.375 CONTOUR — from dimension: 1.750 + 2.312 = 4.062
  await c(4.062, 0, 1.375, '10. R1.375 contour')

  // RIGHT ARM BASE & TIP — on 40° axis from R1.375 center
  // Base: d₁ = 0.500 (tangent to R1.375: d = R1.375 - R.875 = 0.500)
  // Tip: rightmost x = 5.804 → tip_cx = 4.929 → d₂ = (4.929-4.062)/cos40°
  const d1 = 0.500
  const d2 = (5.804 - 0.875 - 4.062) / aD[0]
  const armBase = [4.062 + d1*aD[0], d1*aD[1]]  // (4.445, 0.322)
  const armTip  = [4.062 + d2*aD[0], d2*aD[1]]  // (4.929, 0.728)

  await c(armBase[0], armBase[1], 0.875, '11. R.875 base')
  await c(armTip[0],  armTip[1],  0.875, '12. R.875 tip')
  await c(armBase[0], armBase[1], 0.438, '13. R.438 base')
  await c(armTip[0],  armTip[1],  0.438, '14. R.438 tip')

  // R.625 UPPER — solved: tangent to Ø1.625 (ext) + R.875 base (ext)
  await c(3.149, 1.078, 0.625, '15. R.625 upper')

  // R.625 LOWER — solved: tangent to R1.375 (int) + R.438 base (ext)
  await c(4.259, -0.724, 0.625, '16. R.625 lower')

  // ================================================================
  // REFERENCE LINES
  // ================================================================
  await line([-0.5, 0], [6.5, 0])           // horizontal CL
  await line([1.750, -2.5], [1.750, 2.5])   // vertical axis
  await line([0.750, -1.5], [0.750, 1.5])   // left lobe axis
  await line([4.062, 0], [4.062 + 3*aD[0], 3*aD[1]])  // 40° arm axis

  console.log(`[09] Arm base: (${armBase[0].toFixed(3)}, ${armBase[1].toFixed(3)})`)
  console.log(`[09] Arm tip: (${armTip[0].toFixed(3)}, ${armTip[1].toFixed(3)})`)
  console.log('[09] All 16 circles placed with computed R.625 positions')

  await snapshot('circles-v3')
  return { partId }
}
