// 05-profile-v3.mjs — Corrected positions: Ø1.750 at (1.750, 0), Ø1.625 at (1.750, 0.750)
// R1.750 center at (-0.077, 2.548) — above part, concave upper profile arc
// 1.000 = distance from lobe center (0.750) to main axis (1.750)

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LinkagePlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const noGen = { genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false }
  const PI = Math.PI, cos = Math.cos, sin = Math.sin, sqrt = Math.sqrt

  // ================================================================
  // CENTERS (corrected)
  // ================================================================
  const lobeTopC = [0.750, 0.1875]
  const lobeBotC = [0.750, -0.1875]

  const hub1750  = [1.750, 0]         // Ø1.750
  const upperC   = [1.750, 0.750]     // Ø1.625 + Ø0.750
  const hole1125 = [2.800, 0]         // Ø1.125 (estimated, on centerline)

  // R1.750: solved from tangency to R.750 top (d=2.500) + Ø1.625 (d=2.5625)
  const r1750C = [-0.077, 2.548]

  // R1.375: x = 1.750 + 2.312 = 4.062, y estimated
  const r1375C = [4.062, -0.200]      // slightly below centerline

  // 40° arm
  const ang = 40 * PI / 180
  const aD = [cos(ang), sin(ang)]
  const aP = [-sin(ang), cos(ang)]

  // ================================================================
  // HELPERS
  // ================================================================
  const dist = (a, b) => sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2)
  const norm = v => { const l = sqrt(v[0]**2+v[1]**2); return [v[0]/l, v[1]/l] }
  const dir = (a, b) => norm([b[0]-a[0], b[1]-a[1]])
  const add = (a, b) => [a[0]+b[0], a[1]+b[1]]
  const scl = (v, s) => [v[0]*s, v[1]*s]
  const tPt = (c1, r1, c2) => add(c1, scl(dir(c1, c2), r1))

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
  // LEFT LOBE
  // ================================================================
  const lobeR = 0.750, slotR = 0.437

  // Outer lobe
  const ltR = [lobeTopC[0] + lobeR, lobeTopC[1]]  // (1.500, 0.1875)
  const ltL = [lobeTopC[0] - lobeR, lobeTopC[1]]   // (0, 0.1875)
  const lbR = [lobeBotC[0] + lobeR, lobeBotC[1]]
  const lbL = [lobeBotC[0] - lobeR, lobeBotC[1]]

  await arcCW(ltR, ltL, lobeTopC)     // top semicircle
  await line(ltL, lbL)                 // left straight
  await arcCW(lbL, lbR, lobeBotC)     // bottom semicircle

  // Inner slot
  const stR = [lobeTopC[0] + slotR, lobeTopC[1]]
  const stL = [lobeTopC[0] - slotR, lobeTopC[1]]
  const sbR = [lobeBotC[0] + slotR, lobeBotC[1]]
  const sbL = [lobeBotC[0] - slotR, lobeBotC[1]]

  await arcCW(stR, stL, lobeTopC)
  await line(stL, sbL)
  await arcCW(sbL, sbR, lobeBotC)
  await line(sbR, stR)

  // ================================================================
  // UPPER PROFILE: R.750 top → R1.750 → Ø1.625 boss
  // ================================================================

  // Tangent point on R.750 top toward R1.750 center (external tangent)
  const tp_lobeTop = tPt(lobeTopC, lobeR, r1750C)
  // Tangent point on R1.750 toward R.750 top
  const tp_r1750_lobe = tPt(r1750C, 1.750, lobeTopC)
  // Tangent point on R1.750 toward Ø1.625
  const tp_r1750_upper = tPt(r1750C, 1.750, upperC)
  // Tangent point on Ø1.625 toward R1.750
  const tp_upper_r1750 = tPt(upperC, 0.8125, r1750C)

  console.log(`[05] tp_lobeTop: (${tp_lobeTop.map(v=>v.toFixed(3))})`)
  console.log(`[05] tp_r1750→lobe: (${tp_r1750_lobe.map(v=>v.toFixed(3))})`)
  console.log(`[05] tp_r1750→upper: (${tp_r1750_upper.map(v=>v.toFixed(3))})`)
  console.log(`[05] tp_upper→R1750: (${tp_upper_r1750.map(v=>v.toFixed(3))})`)

  // Lobe top-right to tangent point with R1.750 (small arc on R.750 circle)
  await arcCCW(ltR, tp_lobeTop, lobeTopC)

  // R1.750 arc from lobe tangent to Ø1.625 tangent (CCW since center is above)
  await arcCCW(tp_r1750_lobe, tp_r1750_upper, r1750C)

  // Ø1.625 boss arc: from R1.750 tangent going CW over the top
  const bossRight = [upperC[0] + 0.8125, upperC[1]]  // rightmost point of boss
  await arcCW(tp_upper_r1750, bossRight, upperC)

  // ================================================================
  // LOWER PROFILE: R.750 bot → [line] → R1.375
  // ================================================================

  // The bottom profile: from lobe bottom-right to R1.375 left extent
  // R1.375 leftmost point
  const r1375Left = [r1375C[0] - 1.375, r1375C[1]]  // (2.687, -0.200)
  // Bottom of R1.375
  const r1375Bot = [r1375C[0], r1375C[1] - 1.375]   // (4.062, -1.575)
  // R1.375 rightmost
  const r1375Right = [r1375C[0] + 1.375, r1375C[1]]  // (5.437, -0.200)

  // Straight line from lobe bot-right to R1.375 left (approximate)
  await line(lbR, r1375Left)

  // R1.375 arc along the bottom (left to right)
  await arcCCW(r1375Left, r1375Right, r1375C)

  // ================================================================
  // RIGHT ARM (rough)
  // ================================================================

  // The right arm extends at 40° from the body. Arm tip estimated.
  // R.875 arcs at the tip
  const tipDist = 1.800  // distance along arm axis from base to tip
  const armBase = [4.200, 0.300]
  const armTip = add(armBase, scl(aD, tipDist))
  console.log(`[05] Arm tip: (${armTip.map(v=>v.toFixed(3))})`)

  // R.875 tip arcs (on each side of arm axis)
  const r875u = add(armTip, scl(aP, 0.000))  // at the tip center
  // Draw tip semicircle
  const tipFwd = add(armTip, scl(aD, 0.875))
  const tipBck = add(armTip, scl(aD, -0.875))
  const tipUp = add(armTip, scl(aP, 0.875))
  const tipDn = add(armTip, scl(aP, -0.875))

  // Tip arc (upper half, from front to back going CW)
  await arcCW(tipFwd, tipBck, armTip)
  // Or draw the full tip as two semicircles
  await arcCCW(tipFwd, tipBck, armTip)

  // Arm walls: straight lines from body to tip area
  const armWallUp1 = add(armBase, scl(aP, 0.875))
  const armWallDn1 = add(armBase, scl(aP, -0.875))
  const armWallUp2 = add(armTip, scl(aP, 0.875))
  const armWallDn2 = add(armTip, scl(aP, -0.875))

  // Connect boss to upper arm wall
  await line(bossRight, armWallUp1)
  await line(armWallUp1, armWallUp2)
  // Connect R1.375 to lower arm wall
  await line(r1375Right, armWallDn1)
  await line(armWallDn1, armWallDn2)

  console.log('[05] Profile v3 complete')

  filewrite({
    r1750C, r1375C, hub1750, upperC, hole1125,
    tp_lobeTop, tp_r1750_lobe, tp_r1750_upper, tp_upper_r1750,
    armTip, armBase,
  }, 'v3-data')

  await snapshot('profile-v3')
  return { partId }
}
