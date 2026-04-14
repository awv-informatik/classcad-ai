// 07-all-circles.mjs — Just place all 16 circles. No arcs, no lines, no trimming.
// The profile is formed by trimming these circles at intersection points.
// Key insight: R1.750 contour is concentric with Ø1.750 at (1.750, 0)

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LinkagePlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const noGen = { genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false }
  const PI = Math.PI, cos = Math.cos, sin = Math.sin

  const c = async (cx, cy, r, label) => {
    const id = (await api.v1.sketch.circle({ id: skId, centerPos: [cx, cy, 0], radius: r, ...noGen })).result
    console.log(`[07] ${label}: center=(${cx}, ${cy}), r=${r}, id=${id}`)
    return id
  }

  // 40° arm direction
  const ang = 40 * PI / 180
  const aD = [cos(ang), sin(ang)]     // (0.766, 0.643)
  const aP = [-sin(ang), cos(ang)]    // (-0.643, 0.766)

  // ================================================================
  // LEFT OBLONG — 4 circles (2 centers × 2 radii)
  // Centers from: 1.875 height, R.750 arcs
  // y_offset = (1.875/2) - 0.750 = 0.1875
  // x_center = 0.750 (left edge at x=0)
  // ================================================================
  await c(0.750, 0.1875, 0.750,  '1. R.750 top')
  await c(0.750, -0.1875, 0.750, '2. R.750 bot')
  await c(0.750, 0.1875, 0.437,  '3. R.437 top')
  await c(0.750, -0.1875, 0.437, '4. R.437 bot')

  // ================================================================
  // UPPER ROUND — 2 circles (concentric)
  // Center at (1.750, 0.750) — .750 above centerline, on main vertical axis
  // ================================================================
  await c(1.750, 0.750, 0.8125, '5. Ø1.625')
  await c(1.750, 0.750, 0.375,  '6. Ø0.750')

  // ================================================================
  // MIDDLE ROUND — 3 circles (2 holes + 1 contour)
  // All centered at (1.750, 0) — main vertical axis, on centerline
  // R1.750 contour is concentric with Ø1.750!
  // ================================================================
  await c(1.750, 0, 0.875,  '7. Ø1.750')
  await c(1.750, 0, 0.5625, '8. Ø1.125')
  await c(1.750, 0, 1.750,  '9. R1.750 contour')

  // ================================================================
  // RIGHT CURVED OBLONG — 7 circles
  //
  // The arm extends at 40° from the body. Its axis originates near
  // the R1.375 center area. The arm has:
  //   - 2× R.875: the rounded tip ends
  //   - 2× R.438: the narrow base/waist
  //   - 2× R.625: fillet transitions to body
  //   - 1× R1.375: body contour arc
  //
  // R1.375 center at (4.062, 0) — from 1.750 + 2.312 = 4.062
  // The arm circles are positioned along/around the 40° axis
  // ================================================================

  // R1.375 contour (center from dimension: 1.750 + 2.312 = 4.062)
  await c(4.062, 0, 1.375, '10. R1.375 contour')

  // R.875 tip circles — at the far end of the arm
  // The rightmost point of the part = 5.804
  // One R.875 center at x ≈ 5.804 - 0.875 = 4.929
  // Along the 40° axis from ~(4.062, 0): dist = (4.929-4.062)/cos40° ≈ 1.13
  // Two R.875 offset perpendicular to the arm axis
  const tipAxisDist = 1.100
  const tipCenter = [4.062 + tipAxisDist * aD[0], tipAxisDist * aD[1]]
  const tipSep = 0.200 // perpendicular separation between R.875 centers
  await c(tipCenter[0] + tipSep * aP[0], tipCenter[1] + tipSep * aP[1], 0.875, '11. R.875 upper')
  await c(tipCenter[0] - tipSep * aP[0], tipCenter[1] - tipSep * aP[1], 0.875, '12. R.875 lower')

  // R.438 waist circles — where the arm narrows, along 40° axis
  const waistDist = 0.400
  const waistCenter = [4.062 + waistDist * aD[0], waistDist * aD[1]]
  const waistSep = 0.600
  await c(waistCenter[0] + waistSep * aP[0], waistCenter[1] + waistSep * aP[1], 0.438, '13. R.438 upper')
  await c(waistCenter[0] - waistSep * aP[0], waistCenter[1] - waistSep * aP[1], 0.438, '14. R.438 lower')

  // R.625 fillet transitions — between the waist and the body
  const filletDist = -0.200  // slightly behind the waist, toward the body
  const filletCenter = [4.062 + filletDist * aD[0], filletDist * aD[1]]
  const filletSep = 0.800
  await c(filletCenter[0] + filletSep * aP[0], filletCenter[1] + filletSep * aP[1], 0.625, '15. R.625 upper')
  await c(filletCenter[0] - filletSep * aP[0], filletCenter[1] - filletSep * aP[1], 0.625, '16. R.625 lower')

  // ================================================================
  // REFERENCE LINES
  // ================================================================
  const line = async (a, b) =>
    api.v1.sketch.line({ id: skId, startPos: [...a, 0], endPos: [...b, 0], ...noGen })

  // Horizontal centerline
  await line([-0.5, 0], [6.5, 0])
  // Vertical axis through main centers
  await line([1.750, -2.5], [1.750, 2.5])
  // 40° axis from R1.375 center
  await line([4.062, 0], [4.062 + 2.5*aD[0], 2.5*aD[1]])
  // Left lobe vertical
  await line([0.750, -1.5], [0.750, 1.5])

  console.log('[07] All 16 circles + reference lines placed')

  await snapshot('all-circles')
  return { partId }
}
