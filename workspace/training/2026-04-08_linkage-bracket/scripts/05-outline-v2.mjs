// 05 — Improved outline + corrected slot
// Fixes: slot bulge direction, shallower bottom, rounder right boss
const IN = 25.4

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OutlineV2' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'V2' })).result

  // === BRACKET OUTLINE V2 ===
  // Key adjustments from V1:
  // - Bottom less deep (Ø1.750 center at y=-0.350 instead of -0.750)
  // - Right boss follows R.875 circle centered at (4.929, 0)
  // - Smoother transitions
  //
  // R.875 circle at (4.929,0) key points:
  //   Top: (4.929, 0.875)
  //   Right: (5.804, 0)
  //   Bottom: (4.929, -0.875)
  //   At 60°: (4.929+0.875*cos(60°), 0.875*sin(60°)) = (5.367, 0.758)
  //   At -60°: (5.367, -0.758)
  //   At 30°: (5.687, 0.438)
  //   At -30°: (5.687, -0.438)
  //
  const outline = (await api.v1.curve.shape({ id: eifId, name: 'Outline' })).result
  await api.v1.curve.polyline2d({
    id: outline,
    points: [
      // Left edge
      [0*IN, -0.1875*IN, 0],           // 0: left edge bottom
      [0*IN,  0.1875*IN, 0],           // 1: left edge top
      // Top left boss
      [0.750*IN, 0.9375*IN, 0],        // 2: top of left boss
      // R1.750 descent (computed from center at (0.750, -0.8125))
      [1.250*IN, 0.880*IN, 0],         // 3: R1.750 near start
      [1.750*IN, 0.700*IN, 0],         // 4: R1.750 descending
      [2.200*IN, 0.350*IN, 0],         // 5: R1.750 low area
      // Transition upward toward right boss
      [2.800*IN, 0.200*IN, 0],         // 6: waist area
      [3.400*IN, 0.350*IN, 0],         // 7: ascending
      [3.900*IN, 0.550*IN, 0],         // 8: approaching right boss
      // Right boss (following R.875 circle at (4.929, 0))
      [4.367*IN, 0.758*IN, 0],         // 9: R.875 at ~120°
      [4.929*IN, 0.875*IN, 0],         // 10: top of right boss
      [5.367*IN, 0.758*IN, 0],         // 11: R.875 at ~60°
      [5.687*IN, 0.438*IN, 0],         // 12: R.875 at ~30°
      [5.804*IN, 0.000*IN, 0],         // 13: rightmost point
      [5.687*IN, -0.438*IN, 0],        // 14: R.875 at -30°
      [5.367*IN, -0.758*IN, 0],        // 15: R.875 at -60°
      [4.929*IN, -0.875*IN, 0],        // 16: bottom of right boss
      [4.367*IN, -0.758*IN, 0],        // 17: R.875 at ~-120°
      // Bottom right — descending via R1.375
      [3.800*IN, -0.900*IN, 0],        // 18: bottom right
      [3.200*IN, -1.050*IN, 0],        // 19: R1.375 area
      // Bottom center — Ø1.750 arc (center ~(2.617, -0.350))
      // Bottom of Ø1.750: -0.350 - 0.875 = -1.225
      [2.617*IN, -1.225*IN, 0],        // 20: lowest point
      [2.100*IN, -1.050*IN, 0],        // 21: ascending from bottom
      // Bottom left — R.437 fillets
      [1.500*IN, -0.950*IN, 0],        // 22: bottom left transition
      [1.000*IN, -0.938*IN, 0],        // 23: near left boss bottom
      // Bottom of left boss
      [0.750*IN, -0.9375*IN, 0],       // 24: bottom of left boss
    ],
    bulges: [
      0,      // 0→1: vertical line (left edge)
      0.414,  // 1→2: R.750 quarter arc (top-left boss curve)
      0, 0, 0, 0, 0, 0, 0,  // 2→3→...→9: straight lines for now
      0, 0, 0, 0, 0, 0, 0, 0,  // 9→10→...→17: right boss (straight for now)
      0, 0, 0, 0, 0, 0, // 17→18→...→24: bottom (straight for now)
      -0.414, // 24→close(0): R.750 quarter arc (bottom-left boss curve)
    ],
    close: true
  })

  // === LEFT OBLONG SLOT — CORRECTED bulge direction ===
  const slot = (await api.v1.curve.shape({ id: eifId, name: 'LeftSlot' })).result
  await api.v1.curve.polyline2d({
    id: slot,
    points: [
      [0.625*IN, -0.750*IN, 0],   // bottom-left
      [1.375*IN, -0.750*IN, 0],   // bottom-right
      [1.375*IN,  0.750*IN, 0],   // top-right
      [0.625*IN,  0.750*IN, 0],   // top-left
    ],
    bulges: [0, -1, 0, -1],  // negative = outward semicircles
    close: true
  })

  // Centerline
  const ref = (await api.v1.curve.shape({ id: eifId, name: 'Ref' })).result
  await api.v1.curve.line({ id: ref, startPos: [-0.5*IN, 0, 0], endPos: [6.5*IN, 0, 0] })

  await snapshot('outline-v2')
  console.log('[05] V2 outline with corrected slot bulges and proportions')
}
