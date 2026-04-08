// 08 — Outline V5: shallower bottom, smoother right boss, better proportions
// Target aspect ratio: ~3:1 (width 5.804, height ~1.94)
const IN = 25.4

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OutlineV5' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'V5' })).result

  // Changes from V4:
  // - Bottom raised: lowest at ~-1.000 instead of -1.225
  // - Right boss: fewer points (60° segments), smoother entry/exit
  // - Added bulge estimates for bottom arcs
  //
  // R.875 circle at (4.929, 0) — using 60° segments this time:
  //   120°: (4.491, 0.758)    90°: (4.929, 0.875)
  //    60°: (5.367, 0.758)     0°: (5.804, 0)
  //   -60°: (5.367, -0.758)  -90°: (4.929, -0.875)
  //  -120°: (4.491, -0.758)

  const b60 = Math.tan(Math.PI / 12)   // 0.2679 for 60° arcs
  const b90 = Math.tan(Math.PI / 8)    // 0.4142 for 90° arcs
  const bTop1 = Math.tan(25.4 * Math.PI / 180 / 4)  // ~0.111 for R1.750 first segment
  const bTop2 = Math.tan(20.3 * Math.PI / 180 / 4)  // ~0.089 for R1.750 second segment

  const pts = [
    [0.000,  0.1875],   // 0:  left edge top
    [0.750,  0.9375],   // 1:  top of left boss
    [1.500,  0.769],    // 2:  R1.750 arc (on circle)
    [2.000,  0.413],    // 3:  R1.750 arc (on circle)
    [2.800,  0.200],    // 4:  waist top (transition zone)
    [3.500,  0.400],    // 5:  ascending toward right
    [4.200,  0.700],    // 6:  approaching right boss
    [4.929,  0.875],    // 7:  R.875 top (90°)
    [5.367,  0.758],    // 8:  R.875 at 60°
    [5.804,  0.000],    // 9:  R.875 rightmost (0°)
    [5.367, -0.758],    // 10: R.875 at -60°
    [4.929, -0.875],    // 11: R.875 bottom (-90°)
    [4.200, -0.850],    // 12: leaving right boss (transition)
    [3.500, -0.950],    // 13: bottom right area (R1.375 zone)
    [2.800, -1.000],    // 14: approaching lowest
    [2.200, -1.000],    // 15: lowest area (shallower!)
    [1.600, -0.960],    // 16: ascending from bottom
    [1.000, -0.940],    // 17: near left boss bottom
    [0.750, -0.9375],   // 18: bottom of left boss
    [0.000, -0.1875],   // 19: left edge bottom
  ]

  // 20 points → 20 bulges
  const bulges = [
    b90,       // 0→1:  R.750 quarter arc
    bTop1,     // 1→2:  R1.750 arc
    bTop2,     // 2→3:  R1.750 arc
    0,         // 3→4:  transition
    0,         // 4→5:  ascending
    0,         // 5→6:  approaching right boss
    0,         // 6→7:  connecting to R.875
    b60,       // 7→8:  R.875 60° arc (90° to 60°)
    b60,       // 8→9:  R.875 60° arc (60° to 0°)
    b60,       // 9→10: R.875 60° arc (0° to -60°)
    b60,       // 10→11: R.875 60° arc (-60° to -90°)
    0,         // 11→12: leaving right boss
    0,         // 12→13: R1.375 zone
    0,         // 13→14: approaching bottom
    0,         // 14→15: bottom (flat-ish)
    0,         // 15→16: ascending from bottom
    0,         // 16→17: R.437 zone
    0,         // 17→18: near left boss
    -b90,      // 18→19: R.750 quarter arc
    0,         // 19→close(0): left edge vertical
  ]

  console.log('[08] Points:', pts.length, 'Bulges:', bulges.length)

  const outline = (await api.v1.curve.shape({ id: eifId, name: 'Outline' })).result
  await api.v1.curve.polyline2d({
    id: outline,
    points: pts.map(([x, y]) => [x * IN, y * IN, 0]),
    bulges: bulges,
    close: true
  })

  // === LEFT SLOT ===
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

  // === HOLES ===
  const h1 = (await api.v1.curve.shape({ id: eifId, name: 'H1625' })).result
  await api.v1.curve.circle({ id: h1, centerPos: [2.500*IN, 0.400*IN, 0], radius: 0.8125*IN })
  const h2 = (await api.v1.curve.shape({ id: eifId, name: 'H0750' })).result
  await api.v1.curve.circle({ id: h2, centerPos: [3.250*IN, 0.400*IN, 0], radius: 0.375*IN })
  const h3 = (await api.v1.curve.shape({ id: eifId, name: 'H1125' })).result
  await api.v1.curve.circle({ id: h3, centerPos: [3.750*IN, -0.200*IN, 0], radius: 0.5625*IN })

  // Centerline
  const ref = (await api.v1.curve.shape({ id: eifId, name: 'Ref' })).result
  await api.v1.curve.line({ id: ref, startPos: [-0.5*IN, 0, 0], endPos: [6.5*IN, 0, 0] })

  await snapshot('outline-v5')
  console.log('[08] V5: shallower bottom, 60° right boss arcs')
}
