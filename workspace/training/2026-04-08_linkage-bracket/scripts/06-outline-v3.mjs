// 06 — Outline V3 — fixed bulge count, simplified to 15 points
const IN = 25.4

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OutlineV3' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'V3' })).result

  // === BRACKET OUTLINE ===
  // 15 points, going CCW (positive area), carefully counted bulges
  //
  // Key geometry:
  // - Left boss: R.750 arcs, center at x=0.750, height 1.875" at x=0.750
  // - R1.750 from (0.750, -0.8125), top at y=0.9375, descends going right
  // - Right boss: R.875 at (4.929, 0), rightmost at (5.804, 0)
  // - Bottom: smooth arc, lowest ~y=-1.2
  //
  const pts = [
    [0.000,  0.1875],   // 0: left edge top
    [0.750,  0.9375],   // 1: top of left boss
    [1.500,  0.769],    // 2: R1.750 descent
    [2.200,  0.350],    // 3: waist top
    [3.200,  0.350],    // 4: mid top
    [4.100,  0.700],    // 5: upper right approach
    [4.929,  0.875],    // 6: top of right boss
    [5.804,  0.000],    // 7: rightmost
    [4.929, -0.875],    // 8: bottom of right boss
    [4.100, -0.900],    // 9: bottom right
    [3.200, -1.100],    // 10: bottom center-right
    [2.617, -1.225],    // 11: lowest point
    [2.000, -1.100],    // 12: bottom center-left
    [1.200, -0.950],    // 13: bottom left
    [0.750, -0.9375],   // 14: bottom of left boss
    [0.000, -0.1875],   // 15: left edge bottom
  ]

  // 16 points → 16 segments (with close) → 16 bulges
  const bulges = [
    0.414,  // 0→1:  R.750 quarter arc (left top boss curve)
    0,      // 1→2:  R1.750 arc (straight approx for now)
    0,      // 2→3:  R1.750 continues
    0,      // 3→4:  waist
    0,      // 4→5:  ascending
    0,      // 5→6:  approaching right boss top
    0,      // 6→7:  R.875 arc (right boss top to rightmost)
    0,      // 7→8:  R.875 arc (rightmost to right boss bottom)
    0,      // 8→9:  descending from right boss
    0,      // 9→10: R1.375 area
    0,      // 10→11: approaching lowest point
    0,      // 11→12: ascending from lowest
    0,      // 12→13: R.437 transition
    0,      // 13→14: approaching left boss bottom
    -0.414, // 14→15: R.750 quarter arc (left bottom boss curve)
    0,      // 15→close(0): vertical line (left edge)
  ]

  console.log('[06] Points:', pts.length, 'Bulges:', bulges.length)

  const outline = (await api.v1.curve.shape({ id: eifId, name: 'Outline' })).result
  await api.v1.curve.polyline2d({
    id: outline,
    points: pts.map(([x, y]) => [x * IN, y * IN, 0]),
    bulges: bulges,
    close: true
  })

  // === LEFT SLOT (stadium shape) ===
  // Using separate arcs + lines instead of polyline2d to be sure
  const slot = (await api.v1.curve.shape({ id: eifId, name: 'LeftSlot' })).result

  // Right semicircle: center (1.375, 0), from (1.375, -0.750) to (1.375, 0.750)
  await api.v1.curve.arcByCenter({
    id: slot,
    centerPos: [1.375 * IN, 0, 0],
    startPos: [1.375 * IN, -0.750 * IN, 0],
    endPos: [1.375 * IN, 0.750 * IN, 0],
    isClockwise: false  // CCW = going right then up
  })
  // Top line: from (1.375, 0.750) to (0.625, 0.750)
  await api.v1.curve.line({
    id: slot,
    startPos: [1.375 * IN, 0.750 * IN, 0],
    endPos: [0.625 * IN, 0.750 * IN, 0]
  })
  // Left semicircle: center (0.625, 0), from (0.625, 0.750) to (0.625, -0.750)
  await api.v1.curve.arcByCenter({
    id: slot,
    centerPos: [0.625 * IN, 0, 0],
    startPos: [0.625 * IN, 0.750 * IN, 0],
    endPos: [0.625 * IN, -0.750 * IN, 0],
    isClockwise: false
  })
  // Bottom line: from (0.625, -0.750) to (1.375, -0.750)
  await api.v1.curve.line({
    id: slot,
    startPos: [0.625 * IN, -0.750 * IN, 0],
    endPos: [1.375 * IN, -0.750 * IN, 0]
  })

  // === THREE HOLES ===
  const h1 = (await api.v1.curve.shape({ id: eifId, name: 'Hole_D1625' })).result
  await api.v1.curve.circle({ id: h1, centerPos: [2.500 * IN, 0.500 * IN, 0], radius: 0.8125 * IN })

  const h2 = (await api.v1.curve.shape({ id: eifId, name: 'Hole_D0750' })).result
  await api.v1.curve.circle({ id: h2, centerPos: [3.250 * IN, 0.500 * IN, 0], radius: 0.375 * IN })

  const h3 = (await api.v1.curve.shape({ id: eifId, name: 'Hole_D1125' })).result
  await api.v1.curve.circle({ id: h3, centerPos: [3.750 * IN, -0.125 * IN, 0], radius: 0.5625 * IN })

  // Centerline
  const ref = (await api.v1.curve.shape({ id: eifId, name: 'Ref' })).result
  await api.v1.curve.line({ id: ref, startPos: [-0.5 * IN, 0, 0], endPos: [6.5 * IN, 0, 0] })

  await snapshot('outline-v3')
  console.log('[06] V3: 16-pt outline + stadium slot (arcs+lines) + 3 holes')
}
