// 07 — Outline V4: proper bulges for R1.750 top and R.875 right boss
const IN = 25.4

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OutlineV4' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'V4' })).result

  // R.875 circle at (4.929, 0):
  //   90°: (4.929, 0.875)
  //   60°: (5.367, 0.758)
  //   30°: (5.687, 0.438)
  //    0°: (5.804, 0)
  //  -30°: (5.687, -0.438)
  //  -60°: (5.367, -0.758)
  //  -90°: (4.929, -0.875)
  // -120°: (4.491, -0.758)
  //
  // R1.750 at (0.750, -0.8125):
  //   x=0.750 → y=0.9375
  //   x=1.500 → y=0.769
  //   x=2.000 → y=0.413

  const pts = [
    [0.000,  0.1875],   // 0:  left edge top
    [0.750,  0.9375],   // 1:  top of left boss (on R1.750 at 90°)
    [1.500,  0.769],    // 2:  R1.750 descent (verified on circle)
    [2.000,  0.413],    // 3:  R1.750 continues (verified on circle)
    [2.800,  0.200],    // 4:  waist area (off R1.750 — transition zone)
    [3.500,  0.400],    // 5:  ascending toward right boss
    [4.100,  0.680],    // 6:  approaching right boss
    [4.491,  0.758],    // 7:  R.875 at 120° (on circle)
    [4.929,  0.875],    // 8:  R.875 at 90° (top of right boss)
    [5.367,  0.758],    // 9:  R.875 at 60°
    [5.687,  0.438],    // 10: R.875 at 30°
    [5.804,  0.000],    // 11: R.875 at 0° (rightmost)
    [5.687, -0.438],    // 12: R.875 at -30°
    [5.367, -0.758],    // 13: R.875 at -60°
    [4.929, -0.875],    // 14: R.875 at -90° (bottom of right boss)
    [4.491, -0.758],    // 15: R.875 at -120°
    [3.800, -0.900],    // 16: descending from right boss
    [3.200, -1.050],    // 17: bottom right area (R1.375 zone)
    [2.617, -1.225],    // 18: lowest point (Ø1.750 bottom)
    [2.000, -1.050],    // 19: ascending from bottom
    [1.400, -0.950],    // 20: bottom left (R.437 zone)
    [0.750, -0.9375],   // 21: bottom of left boss
    [0.000, -0.1875],   // 22: left edge bottom
  ]

  // 23 points → 23 bulges (with close=true)
  // Bulge for 30° arc: tan(7.5°) ≈ 0.1317
  // Bulge for 90° arc (quarter circle): tan(22.5°) ≈ 0.4142
  // Bulge for 25° arc: tan(6.25°) ≈ 0.109
  const b30 = Math.tan(Math.PI / 24)   // 0.1317 for 30° arc segments
  const b90 = Math.tan(Math.PI / 8)    // 0.4142 for 90° arc segments

  // R1.750 arc: segments 1→2 and 2→3 (both on R1.750 circle)
  // Angle from center (0.750, -0.8125):
  //   pt1 at 90°, pt2 at ~64.6° → span ~25.4°, bulge ~0.111
  //   pt2 at ~64.6°, pt3 at ~44.3° → span ~20.3°, bulge ~0.089
  // These arcs curve CW in standard view → positive bulge
  const bR1750_1 = Math.tan(25.4 * Math.PI / 180 / 4)  // ≈ 0.111
  const bR1750_2 = Math.tan(20.3 * Math.PI / 180 / 4)  // ≈ 0.089

  const bulges = [
    b90,       // 0→1:  R.750 quarter arc (left boss top-left)
    bR1750_1,  // 1→2:  R1.750 arc
    bR1750_2,  // 2→3:  R1.750 arc continues
    0,         // 3→4:  transition (off R1.750)
    0,         // 4→5:  ascending
    0,         // 5→6:  approaching right boss
    0,         // 6→7:  connecting to R.875
    b30,       // 7→8:  R.875 30° arc (120° to 90°)
    b30,       // 8→9:  R.875 30° arc (90° to 60°)
    b30,       // 9→10: R.875 30° arc (60° to 30°)
    b30,       // 10→11: R.875 30° arc (30° to 0°)
    b30,       // 11→12: R.875 30° arc (0° to -30°)
    b30,       // 12→13: R.875 30° arc (-30° to -60°)
    b30,       // 13→14: R.875 30° arc (-60° to -90°)
    b30,       // 14→15: R.875 30° arc (-90° to -120°)
    0,         // 15→16: leaving right boss
    0,         // 16→17: bottom right
    0,         // 17→18: approaching lowest
    0,         // 18→19: ascending from lowest
    0,         // 19→20: bottom left transition
    0,         // 20→21: approaching left boss bottom
    -b90,      // 21→22: R.750 quarter arc (left boss bottom-left)
    0,         // 22→close(0): vertical line (left edge)
  ]

  console.log('[07] Points:', pts.length, 'Bulges:', bulges.length)

  const outline = (await api.v1.curve.shape({ id: eifId, name: 'Outline' })).result
  await api.v1.curve.polyline2d({
    id: outline,
    points: pts.map(([x, y]) => [x * IN, y * IN, 0]),
    bulges: bulges,
    close: true
  })

  // === LEFT SLOT (using arcByCenter + lines) ===
  const slot = (await api.v1.curve.shape({ id: eifId, name: 'LeftSlot' })).result
  await api.v1.curve.arcByCenter({
    id: slot, centerPos: [1.375*IN, 0, 0],
    startPos: [1.375*IN, -0.750*IN, 0], endPos: [1.375*IN, 0.750*IN, 0],
    isClockwise: false
  })
  await api.v1.curve.line({ id: slot,
    startPos: [1.375*IN, 0.750*IN, 0], endPos: [0.625*IN, 0.750*IN, 0] })
  await api.v1.curve.arcByCenter({
    id: slot, centerPos: [0.625*IN, 0, 0],
    startPos: [0.625*IN, 0.750*IN, 0], endPos: [0.625*IN, -0.750*IN, 0],
    isClockwise: false
  })
  await api.v1.curve.line({ id: slot,
    startPos: [0.625*IN, -0.750*IN, 0], endPos: [1.375*IN, -0.750*IN, 0] })

  // === THREE HOLES ===
  const h1 = (await api.v1.curve.shape({ id: eifId, name: 'H_1625' })).result
  await api.v1.curve.circle({ id: h1, centerPos: [2.500*IN, 0.400*IN, 0], radius: 0.8125*IN })
  const h2 = (await api.v1.curve.shape({ id: eifId, name: 'H_0750' })).result
  await api.v1.curve.circle({ id: h2, centerPos: [3.250*IN, 0.400*IN, 0], radius: 0.375*IN })
  const h3 = (await api.v1.curve.shape({ id: eifId, name: 'H_1125' })).result
  await api.v1.curve.circle({ id: h3, centerPos: [3.750*IN, -0.200*IN, 0], radius: 0.5625*IN })

  // Centerline
  const ref = (await api.v1.curve.shape({ id: eifId, name: 'Ref' })).result
  await api.v1.curve.line({ id: ref, startPos: [-0.5*IN, 0, 0], endPos: [6.5*IN, 0, 0] })

  await snapshot('outline-v4')
  console.log('[07] V4: R1.750 + R.875 bulges added')
}
