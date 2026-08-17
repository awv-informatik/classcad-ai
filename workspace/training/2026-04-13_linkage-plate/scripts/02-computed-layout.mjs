// 02-computed-layout.mjs — Layout computed from dimension + tangency constraints
// Origin: left edge x=0, horizontal centerline y=0
// All dimensions in inches

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LinkagePlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const noGen = { genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false }

  // ================================================================
  // POSITION DERIVATION
  // ================================================================

  // LEFT LOBE: from 1.875 height, R.750 arcs
  // Height = 2*(y_c + R) = 1.875 → y_c = (1.875/2) - 0.750 = 0.1875
  // Left edge at x=0 → x_c = 0.750
  const lobeC = { x: 0.750, y: 0.1875 }   // R.750 arc centers at (x, ±y)

  // Ø1.750: 1.000 dimension from left edge → center at x=1.000
  // Vertical: on centerline (y=0) — the horizontal dashed line passes through it
  const hub1750 = { x: 1.000, y: 0 }

  // Ø1.625 + Ø0.750: .750 above centerline → center at y=0.750
  // x: on the same vertical line as Ø1.750 (x=1.000) based on construction lines
  const upperHole = { x: 1.000, y: 0.750 }

  // R1.375: 2.312 from Ø1.750 center → x = 1.000 + 2.312 = 3.312
  // y: below centerline, connects to bottom profile. Estimate from source proportions.
  // R1.375 is a large concave arc on the bottom profile
  // If tangent to Ø1.750 (external): d = R1.375 + R_1750 = 1.375 + 0.875 = 2.250
  // But horizontal distance = 2.312 > 2.250, so slightly more than tangent distance
  // This means R1.375 center might be slightly below the Ø1.750 center
  // d² = 2.312² + dy² = 2.250² → dy² = 5.063 - 5.345 = NEGATIVE
  // So they're NOT externally tangent. R1.375 must be internally tangent or not tangent to Ø1.750 directly.
  // The bottom profile likely goes: R.750 bottom → some transition → Ø1.750 area → R1.375
  // Place R1.375 center below: y estimate = -0.5 (concave, center below profile)
  const r1375C = { x: 3.312, y: -0.500 }

  // Ø1.125: appears to be between Ø1.750 and R1.375 areas
  // From source: roughly at x≈2.2, y≈-0.2
  // Actually looking at the source, Ø1.125 seems to be at roughly (2.2, 0) on the centerline
  const hole1125 = { x: 2.200, y: 0 }

  // R1.750: large profile arc
  // Internal tangent to R.750 top: d = R1.750 - R.750 = 1.000
  // Internal tangent to Ø1.625: d = R1.750 - R_1625 = 0.9375
  // Solved (from constraint system):
  // Solution 1: (0.079, 0.930) — too far left
  // Solution 2: (1.749, 0.188) — near main axis
  // BUT let me try external tangent to R.750 (d=2.500) with a position ABOVE the part
  // R1.750 center above the part makes a concave arc sweeping the top profile
  // With Ø1.625 at (1.000, 0.750), the R1.750 arc passes above it
  // Let me just estimate from the source: center roughly at (1.5, 2.0)
  const r1750C = { x: 1.500, y: 2.000 }

  // RIGHT ARM at 40° from horizontal
  // The arm extends from roughly (3.3, 0) at 40° upward-right
  // Arm tip at roughly x=5.0-5.5
  const ang40 = 40 * Math.PI / 180
  const armBaseX = 3.500, armBaseY = -0.200
  const armLen = 2.0 // rough arm length along axis
  const armTipX = armBaseX + armLen * Math.cos(ang40)  // ~5.03
  const armTipY = armBaseY + armLen * Math.sin(ang40)   // ~1.09

  // R.875 arcs at arm tip — two arcs on each side of the arm axis
  // Arm axis direction: (cos40, sin40) = (0.766, 0.643)
  // Perpendicular: (-sin40, cos40) = (-0.643, 0.766)
  const armDir = [Math.cos(ang40), Math.sin(ang40)]
  const armPerp = [-Math.sin(ang40), Math.cos(ang40)]
  const r875_1 = { x: armTipX + 0.875 * armPerp[0], y: armTipY + 0.875 * armPerp[1] }
  const r875_2 = { x: armTipX - 0.875 * armPerp[0], y: armTipY - 0.875 * armPerp[1] }

  // R.625 arcs — transition at arm root (where arm meets body)
  const r625_1 = { x: armBaseX + 0.625 * armPerp[0], y: armBaseY + 0.625 * armPerp[1] }
  const r625_2 = { x: armBaseX - 0.625 * armPerp[0], y: armBaseY - 0.625 * armPerp[1] }

  // R.438 arcs — between R.625 and R.875
  const midArmX = (armBaseX + armTipX) / 2
  const midArmY = (armBaseY + armTipY) / 2
  const r438_1 = { x: midArmX + 0.438 * armPerp[0], y: midArmY + 0.438 * armPerp[1] }
  const r438_2 = { x: midArmX - 0.438 * armPerp[0], y: midArmY - 0.438 * armPerp[1] }

  // ================================================================
  // DRAW
  // ================================================================

  const c = async (cx, cy, r) => api.v1.sketch.circle({ id: skId, centerPos: [cx, cy, 0], radius: r, ...noGen })
  const l = async (x1, y1, x2, y2) => api.v1.sketch.line({ id: skId, startPos: [x1, y1, 0], endPos: [x2, y2, 0], ...noGen })

  // Through-holes
  await c(upperHole.x, upperHole.y, 0.8125)   // Ø1.625
  await c(upperHole.x, upperHole.y, 0.375)    // Ø0.750
  await c(hub1750.x, hub1750.y, 0.875)        // Ø1.750
  await c(hole1125.x, hole1125.y, 0.5625)     // Ø1.125

  // Left lobe
  await c(lobeC.x, lobeC.y, 0.750)       // R.750 top
  await c(lobeC.x, -lobeC.y, 0.750)      // R.750 bottom
  await c(lobeC.x, lobeC.y, 0.437)       // R.437 top slot
  await c(lobeC.x, -lobeC.y, 0.437)      // R.437 bottom slot

  // Left lobe straight sides (tangent lines between top and bottom arcs)
  // Outer left: x = 0.750 - 0.750 = 0
  await l(0, lobeC.y, 0, -lobeC.y)
  // Outer right: x = 0.750 + 0.750 = 1.500
  await l(1.500, lobeC.y, 1.500, -lobeC.y)
  // Inner left: x = 0.750 - 0.437 = 0.313
  await l(0.313, lobeC.y, 0.313, -lobeC.y)
  // Inner right: x = 0.750 + 0.437 = 1.187
  await l(1.187, lobeC.y, 1.187, -lobeC.y)

  // Profile arcs (full circles for now)
  await c(r1750C.x, r1750C.y, 1.750)     // R1.750
  await c(r1375C.x, r1375C.y, 1.375)     // R1.375

  // Right arm arcs
  await c(r875_1.x, r875_1.y, 0.875)
  await c(r875_2.x, r875_2.y, 0.875)
  await c(r625_1.x, r625_1.y, 0.625)
  await c(r625_2.x, r625_2.y, 0.625)
  await c(r438_1.x, r438_1.y, 0.438)
  await c(r438_2.x, r438_2.y, 0.438)

  // Reference lines
  await l(-0.5, 0, 6.5, 0)                // horizontal centerline
  await l(hub1750.x, -1.5, hub1750.x, 2)  // vertical through Ø1.750
  // 40° arm axis
  await l(armBaseX, armBaseY, armBaseX + 3*armDir[0], armBaseY + 3*armDir[1])

  // Log all centers for debugging
  const centers = {
    lobeC, hub1750, upperHole, hole1125, r1750C, r1375C,
    r875_1, r875_2, r625_1, r625_2, r438_1, r438_2,
    armBase: { x: armBaseX, y: armBaseY },
    armTip: { x: armTipX, y: armTipY },
  }
  console.log('[02] Centers:', JSON.stringify(centers, null, 2))
  filewrite(centers, 'computed-centers')

  await snapshot('layout-v2')
  return { partId }
}
