// 04-profile-v2.mjs — Refined profile with proper arc chain
// Key insight: the entire outer profile is a chain of tangent arcs.
// R1.750 center at (3.056, -0.782) from solved tangency constraints.
// Profile chain (CW from top-left): R.750 top → R1.750 → Ø1.625 boss → right arm → R1.375 → R.750 bot

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LinkagePlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const noGen = { genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false }

  const PI = Math.PI, cos = Math.cos, sin = Math.sin, sqrt = Math.sqrt, atan2 = Math.atan2

  // ================================================================
  // CENTERS
  // ================================================================

  // Left lobe R.750 centers
  const lobeTopC = [0.750, 0.1875]
  const lobeBotC = [0.750, -0.1875]

  // Through-holes
  const hub1750  = [1.000, 0]        // Ø1.750 (r=0.875)
  const upperC   = [1.000, 0.750]    // Ø1.625 (r=0.8125) + Ø0.750 (r=0.375) concentric
  const hole1125 = [2.300, -0.100]   // Ø1.125 (r=0.5625) estimated

  // Profile-defining arc centers (computed)
  const r1750C = [3.056, -0.782]     // R1.750 — solved from tangency
  const r1375C = [3.312, -0.508]     // R1.375 — from dimension + tangency to R1.750

  // 40° arm
  const ang = 40 * PI / 180
  const aD = [cos(ang), sin(ang)]       // arm direction
  const aP = [-sin(ang), cos(ang)]      // arm perpendicular

  // ================================================================
  // HELPERS
  // ================================================================
  const dist = (a, b) => sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2)
  const norm = v => { const l = sqrt(v[0]**2+v[1]**2); return [v[0]/l, v[1]/l] }
  const dir = (a, b) => norm([b[0]-a[0], b[1]-a[1]])
  const add = (a, b) => [a[0]+b[0], a[1]+b[1]]
  const scale = (v, s) => [v[0]*s, v[1]*s]

  // Tangent point: on circle1 (center c1, radius r1) toward circle2 (center c2)
  const tPt = (c1, r1, c2) => add(c1, scale(dir(c1, c2), r1))
  // Tangent point away from c2 (opposite side)
  const tPtAway = (c1, r1, c2) => add(c1, scale(dir(c2, c1), r1))

  const circle = async (c, r) =>
    (await api.v1.sketch.circle({ id: skId, centerPos: [...c, 0], radius: r, ...noGen })).result
  const line = async (a, b) =>
    (await api.v1.sketch.line({ id: skId, startPos: [...a, 0], endPos: [...b, 0], ...noGen })).result
  const arcCW = async (s, e, c) =>
    (await api.v1.sketch.arcByCenter({ id: skId, startPos: [...s, 0], endPos: [...e, 0], centerPos: [...c, 0], isClockwise: true, ...noGen })).result
  const arcCCW = async (s, e, c) =>
    (await api.v1.sketch.arcByCenter({ id: skId, startPos: [...s, 0], endPos: [...e, 0], centerPos: [...c, 0], isClockwise: false, ...noGen })).result

  // ================================================================
  // THROUGH-HOLES
  // ================================================================
  await circle(hub1750, 0.875)
  await circle(upperC, 0.8125)
  await circle(upperC, 0.375)
  await circle(hole1125, 0.5625)

  // ================================================================
  // LEFT LOBE (outer + inner slot)
  // ================================================================
  // Outer contour: right half-circles first, then left straight, then left half-circles
  // The lobe outer right side tangent point connects to R1.750 arc
  const lobeTopRight = [lobeTopC[0] + 0.750, lobeTopC[1]]  // (1.500, 0.1875)
  const lobeBotRight = [lobeBotC[0] + 0.750, lobeBotC[1]]  // (1.500, -0.1875)
  const lobeTopLeft  = [lobeTopC[0] - 0.750, lobeTopC[1]]  // (0, 0.1875)
  const lobeBotLeft  = [lobeBotC[0] - 0.750, lobeBotC[1]]  // (0, -0.1875)

  // Outer: top semicircle (right to left, CW)
  await arcCW(lobeTopRight, lobeTopLeft, lobeTopC)
  // Left straight
  await line(lobeTopLeft, lobeBotLeft)
  // Bottom semicircle (left to right, CW)
  await arcCW(lobeBotLeft, lobeBotRight, lobeBotC)

  // Inner slot
  const sR = 0.437
  const slotTR = [lobeTopC[0] + sR, lobeTopC[1]]
  const slotTL = [lobeTopC[0] - sR, lobeTopC[1]]
  const slotBR = [lobeBotC[0] + sR, lobeBotC[1]]
  const slotBL = [lobeBotC[0] - sR, lobeBotC[1]]
  await arcCW(slotTR, slotTL, lobeTopC)
  await line(slotTL, slotBL)
  await arcCW(slotBL, slotBR, lobeBotC)
  await line(slotBR, slotTR)

  console.log('[04] Left lobe done')

  // ================================================================
  // MAIN PROFILE CHAIN (CW from lobe top-right)
  // ================================================================

  // 1. R1.750 arc: from lobe top-right toward Ø1.625
  // Tangent point on R1.750 toward R.750 top center
  const tp_r1750_lobe = tPt(r1750C, 1.750, lobeTopC)
  // Tangent point on R1.750 toward Ø1.625 center
  const tp_r1750_upper = tPt(r1750C, 1.750, upperC)

  console.log(`[04] R1.750 arc: (${tp_r1750_lobe.map(v=>v.toFixed(3))}) → (${tp_r1750_upper.map(v=>v.toFixed(3))})`)

  // Connect lobe top-right to R1.750 tangent point (these should be the same for external tangent)
  // For external tangent: the tangent point on R.750 = tPt(lobeTopC, 0.750, r1750C)
  const tp_lobe_r1750 = tPt(lobeTopC, 0.750, r1750C)
  console.log(`[04] Lobe→R1.750 tangent: (${tp_lobe_r1750.map(v=>v.toFixed(3))})`)

  // These should match: tp_lobe_r1750 ≈ tp_r1750_lobe (both are the tangent point)
  // Draw the lobe top right-side arc from lobeTopRight to tp_lobe_r1750
  if (dist(lobeTopRight, tp_lobe_r1750) > 0.01) {
    await arcCCW(lobeTopRight, tp_lobe_r1750, lobeTopC)
  }

  // R1.750 arc (CW from tangent with lobe to tangent with Ø1.625)
  await arcCW(tp_r1750_lobe, tp_r1750_upper, r1750C)

  // 2. Ø1.625 boss arc: from R1.750 tangent to a point on the right side
  // The tangent point on Ø1.625 from R1.750
  const tp_upper_r1750 = tPt(upperC, 0.8125, r1750C)
  console.log(`[04] Ø1.625 tangent from R1.750: (${tp_upper_r1750.map(v=>v.toFixed(3))})`)

  // The boss continues CW around the top. For now, go to the rightmost point of the boss.
  const bossRight = [upperC[0] + 0.8125, upperC[1]]
  const bossTop = [upperC[0], upperC[1] + 0.8125]
  // Draw boss arc from R1.750 tangent point going CW over the top to the right side
  await arcCW(tp_upper_r1750, bossRight, upperC)

  // 3. From Ø1.625 boss right → transition to right arm area
  // For now draw a straight line to approximate the connection
  // The R.625 transition arcs would go here

  // 4. R1.375 arc: lower profile
  // Tangent with R1.750 (internal tangent, d = 0.375)
  const tp_r1375_r1750 = tPt(r1375C, 1.375, r1750C)
  console.log(`[04] R1.375→R1.750 tangent: (${tp_r1375_r1750.map(v=>v.toFixed(3))})`)

  // R1.375 left extent
  const r1375_leftPt = [r1375C[0] - 1.375, r1375C[1]]

  // Draw R1.375 lower arc from left to tangent with R1.750
  await arcCCW(r1375_leftPt, tp_r1375_r1750, r1375C)

  // 5. Connect R1.375 left to lobe bottom-right
  // Need transition from R1.375 left (1.937, -0.508) back to lobe bottom-right (1.500, -0.1875)
  // For now just a line
  await line(r1375_leftPt, lobeBotRight)

  // 6. Right arm — rough outline
  // Arm base near (3.5, 0.5), extending at 40°
  // Two R.875 circles at tip
  const tipCenter = [4.600, 0.900]
  const r875_upper = add(tipCenter, scale(aP, 0.875))
  const r875_lower = add(tipCenter, scale(aP, -0.875))
  await circle(r875_upper, 0.875)
  await circle(r875_lower, 0.875)

  // Arm tip semicircle connecting the two R.875 arcs
  const tipFront = add(tipCenter, scale(aD, 0.875))
  // Each R.875 extends 0.875 from its center in the arm direction
  // The outermost points:
  const tipUpperFront = add(r875_upper, scale(aD, 0))
  const tipLowerFront = add(r875_lower, scale(aD, 0))

  console.log(`[04] Right arm tip: upper=(${r875_upper.map(v=>v.toFixed(2))}), lower=(${r875_lower.map(v=>v.toFixed(2))})`)

  // Connect boss right to upper arm area (rough line)
  await line(bossRight, [r875_upper[0] - 1.5*aD[0], r875_upper[1] - 1.5*aD[1]])

  // Connect R1.375 right to lower arm area (rough line)
  await line(tp_r1375_r1750, [r875_lower[0] - 1.5*aD[0], r875_lower[1] - 1.5*aD[1]])

  console.log('[04] Profile v2 complete')

  await snapshot('profile-v2')
  return { partId }
}
