// 06-profile-v4.mjs — Fix right arm (rounded, not pointed) + bottom profile
// Right arm: slot shape at 40° with R.875 tip, R.438 base, R.625 fillets

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LinkagePlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const noGen = { genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false }
  const PI = Math.PI, cos = Math.cos, sin = Math.sin, sqrt = Math.sqrt

  // ================================================================
  // CENTERS
  // ================================================================
  const lobeTopC = [0.750, 0.1875]
  const lobeBotC = [0.750, -0.1875]
  const hub1750  = [1.750, 0]
  const upperC   = [1.750, 0.750]
  const hole1125 = [2.800, 0]
  const r1750C   = [-0.077, 2.548]    // R1.750 solved
  const r1375C   = [4.062, 0.300]     // R1.375 adjusted (center inside part)

  const ang = 40 * PI / 180
  const aD = [cos(ang), sin(ang)]
  const aP = [-sin(ang), cos(ang)]

  // ================================================================
  // HELPERS
  // ================================================================
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
  const ltR = add(lobeTopC, [lobeR, 0])
  const ltL = add(lobeTopC, [-lobeR, 0])
  const lbR = add(lobeBotC, [lobeR, 0])
  const lbL = add(lobeBotC, [-lobeR, 0])

  await arcCW(ltR, ltL, lobeTopC)
  await line(ltL, lbL)
  await arcCW(lbL, lbR, lobeBotC)

  // Inner slot
  const stR = add(lobeTopC, [slotR, 0])
  const stL = add(lobeTopC, [-slotR, 0])
  const sbR = add(lobeBotC, [slotR, 0])
  const sbL = add(lobeBotC, [-slotR, 0])
  await arcCW(stR, stL, lobeTopC)
  await line(stL, sbL)
  await arcCW(sbL, sbR, lobeBotC)
  await line(sbR, stR)

  // ================================================================
  // UPPER PROFILE: R.750 top → R1.750 → Ø1.625 boss
  // ================================================================
  const tp_lobeTop = tPt(lobeTopC, lobeR, r1750C)
  const tp_r1750_lobe = tPt(r1750C, 1.750, lobeTopC)
  const tp_r1750_upper = tPt(r1750C, 1.750, upperC)
  const tp_upper_r1750 = tPt(upperC, 0.8125, r1750C)

  // Lobe top CW arc to tangent point
  await arcCCW(ltR, tp_lobeTop, lobeTopC)
  // R1.750 concave arc
  await arcCCW(tp_r1750_lobe, tp_r1750_upper, r1750C)
  // Ø1.625 boss upper arc to rightmost point
  const bossRight = [upperC[0] + 0.8125, upperC[1]]
  const bossTop = [upperC[0], upperC[1] + 0.8125]
  await arcCW(tp_upper_r1750, bossRight, upperC)

  // ================================================================
  // RIGHT ARM (40° rounded slot)
  // ================================================================

  // Arm geometry: axis at 40° from armBase, tip at armTip
  // Width defined by R.875 at tip
  // The arm base connects to the main body near (3.0, 0.5) area
  const armBase = [3.500, 0.200]
  const armLength = 1.600
  const armTip = add(armBase, scl(aD, armLength))
  const armW = 0.875  // half-width at tip

  console.log(`[06] Arm base: (${armBase}), tip: (${armTip.map(v=>v.toFixed(3))})`)

  // Tip semicircle (rounded end)
  const tipUp = add(armTip, scl(aP, armW))
  const tipDn = add(armTip, scl(aP, -armW))
  // CW semicircle from upper to lower around the tip
  await arcCW(tipUp, tipDn, armTip)

  // Arm walls (parallel to arm axis, offset by armW)
  const baseUp = add(armBase, scl(aP, armW))
  const baseDn = add(armBase, scl(aP, -armW))

  await line(baseUp, tipUp)
  await line(tipDn, baseDn)

  // ================================================================
  // CONNECTIONS: boss → upper arm, R1.375 → lower arm
  // ================================================================

  // Connect Ø1.625 boss right to arm upper wall
  await line(bossRight, baseUp)

  // R1.375 arc (bottom profile)
  // R1.375 centered at (4.062, 0.300), r=1.375
  // The bottom of this arc is at y = 0.300 - 1.375 = -1.075
  const r1375Left = [r1375C[0] - 1.375, r1375C[1]]   // (2.687, 0.300)
  const r1375Bot = [r1375C[0], r1375C[1] - 1.375]     // (4.062, -1.075)

  // Draw R1.375 lower arc from left to a point toward the arm
  // The arc connects the lower body to the lower arm wall
  await arcCW(r1375Left, baseDn, r1375C)

  // Bottom connection: from lobe bottom-right to R1.375 left
  await line(lbR, r1375Left)

  console.log('[06] Profile v4 complete')

  filewrite({
    armBase, armTip, r1375C,
    bossRight, baseUp, baseDn,
    r1375Left,
  }, 'v4-data')

  await snapshot('profile-v4')
  return { partId }
}
