// 04 — Polygon approximation of bracket outline + left slot
// Trace the outline with straight lines first, then refine to arcs
// All dimensions in mm (inch × 25.4)
//
// Key derived positions:
// - Left boss R.750 arc centers at (0.750", ±0.1875"), leftmost at x=0
// - R1.750 center at (0.750", -0.8125") — tangent to left boss top
//   Top of arc at y = 0.9375" (same as left boss top)
//   Arc descends going right: x=1.5→y=0.769, x=2.0→y=0.413
// - Right boss at x=4.929", R=0.875, rightmost at 5.804"
// - Bottom Ø1.750 (R=0.875) at estimated center (2.617", -0.750")
//
const IN = 25.4

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OutlineApprox' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'Outline' })).result

  // === BRACKET OUTLINE — polygon approximation ===
  // Going counterclockwise (positive area in standard 2D view)
  // Starting from left edge top
  const outline = (await api.v1.curve.shape({ id: eifId, name: 'Outline' })).result
  await api.v1.curve.polyline2d({
    id: outline,
    points: [
      // Left edge (short vertical line between the two R.750 arcs)
      [0*IN, -0.1875*IN, 0],         // 0: left edge bottom
      [0*IN,  0.1875*IN, 0],          // 1: left edge top
      // Top of left boss (R.750 arc rises to peak)
      [0.750*IN, 0.9375*IN, 0],       // 2: top of left boss
      // R1.750 arc descends going right
      [1.500*IN, 0.769*IN, 0],        // 3: R1.750 at x=1.5
      [2.000*IN, 0.413*IN, 0],        // 4: R1.750 at x=2.0 (low point)
      // Transition upward toward right boss
      // This is where R.625/R.438/R.875 arcs are
      [3.000*IN, 0.400*IN, 0],        // 5: rising toward right
      [3.750*IN, 0.650*IN, 0],        // 6: continuing rise
      // Right boss area (R.875 arcs, 40° slot)
      [4.400*IN, 0.800*IN, 0],        // 7: upper right
      [4.929*IN, 0.875*IN, 0],        // 8: top of right boss
      [5.500*IN, 0.550*IN, 0],        // 9: right side descending
      [5.804*IN, 0.000*IN, 0],        // 10: rightmost point
      [5.500*IN, -0.550*IN, 0],       // 11: right side bottom
      [4.929*IN, -0.875*IN, 0],       // 12: bottom of right boss
      // Bottom right — R1.375 arc descends
      [4.400*IN, -1.000*IN, 0],       // 13: bottom right
      [3.750*IN, -1.200*IN, 0],       // 14: bottom right transition
      // Bottom center — Ø1.750 arc
      [3.000*IN, -1.400*IN, 0],       // 15: approaching bottom
      [2.617*IN, -1.625*IN, 0],       // 16: lowest point (Ø1.750 bottom)
      [2.200*IN, -1.400*IN, 0],       // 17: ascending from bottom
      // Bottom left transition (R.437 fillets)
      [1.500*IN, -1.100*IN, 0],       // 18: bottom left transition
      // Bottom of left boss
      [0.750*IN, -0.9375*IN, 0],      // 19: bottom of left boss
    ],
    bulges: [
      0,     // 0→1: vertical line (left edge)
      0.414, // 1→2: R.750 quarter arc (positive = CW in top-down view)
      0,     // 2→3: R1.750 arc approximated as line for now
      0,     // 3→4: R1.750 continues
      0,     // 4→5: transition
      0,     // 5→6: transition
      0,     // 6→7: approaching right boss
      0,     // 7→8: R.875 arc
      0,     // 8→9: right side descending
      0,     // 9→10: R.875 arc to rightmost
      0,     // 10→11: R.875 bottom arc
      0,     // 11→12: R.875 continues
      0,     // 12→13: bottom right
      0,     // 13→14: R1.375 arc
      0,     // 14→15: R1.375 continues
      0,     // 15→16: Ø1.750 bottom
      0,     // 16→17: Ø1.750 ascending
      0,     // 17→18: R.437 transition
      0,     // 18→19: R.437 continues
      -0.414, // 19→close(0): R.750 quarter arc (negative = CCW)
    ],
    close: true
  })

  // === LEFT OBLONG SLOT (inside the left boss) ===
  const slot = (await api.v1.curve.shape({ id: eifId, name: 'LeftSlot' })).result
  await api.v1.curve.polyline2d({
    id: slot,
    points: [
      [0.625*IN, -0.750*IN, 0],
      [1.375*IN, -0.750*IN, 0],
      [1.375*IN,  0.750*IN, 0],
      [0.625*IN,  0.750*IN, 0],
    ],
    bulges: [0, 1, 0, 1],
    close: true
  })

  // === REFERENCE LINES ===
  const ref = (await api.v1.curve.shape({ id: eifId, name: 'Ref' })).result
  await api.v1.curve.line({ id: ref, startPos: [-0.5*IN, 0, 0], endPos: [6.5*IN, 0, 0] }) // centerline

  await snapshot('outline-polygon-v1')

  console.log('[04] Polygon outline with 20 points + left slot')
  console.log('[04] Key points: left boss top (0.75, 0.94), R1.750 descent, right boss, bottom Ø1.750')
}
