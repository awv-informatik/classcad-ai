// 15 — Compute exact tangent points between adjacent arc segments
// Build the bottom outline from tangent arc chain:
//   R.750bot → R.437 fillet → Ø1.750 → R1.375 → R.875 right boss
const IN = 25.4

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TangentChain' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'TC' })).result
  const mk = async (name) => (await api.v1.curve.shape({ id: eifId, name })).result
  const p = ([x, y]) => [x*IN, y*IN, 0]

  // === GEOMETRY HELPERS ===
  const dist = (a, b) => Math.sqrt((b[0]-a[0])**2 + (b[1]-a[1])**2)
  const ptOn = (cx, cy, r, deg) => {
    const a = deg * Math.PI / 180
    return [cx + r*Math.cos(a), cy + r*Math.sin(a)]
  }
  // Tangent point between two externally tangent circles
  const tangentPt = (c1, r1, c2) => {
    const d = dist(c1, c2)
    return [c1[0] + r1*(c2[0]-c1[0])/d, c1[1] + r1*(c2[1]-c1[1])/d]
  }

  // === CIRCLE DEFINITIONS ===
  // Centers and radii of all outline arcs
  const C = {
    R750top:  { c: [0.750, 0.1875],  r: 0.750 },   // left boss top
    R750bot:  { c: [0.750, -0.1875], r: 0.750 },    // left boss bottom
    R1750:    { c: [0.750, -0.8125], r: 1.750 },    // top outline
    R875rb:   { c: [4.929, 0.000],   r: 0.875 },    // right boss
    D1750:    { c: [2.617, -0.350],  r: 0.875 },    // bottom center
    R1375:    { c: [4.062, -2.081],  r: 1.375 },    // bottom right (computed)
    R437:     { c: [1.526, -1.121],  r: 0.437 },    // bottom left fillet (computed)
  }

  // === COMPUTE TANGENT POINTS ===
  // R1.750 / R.750top tangent (internal: R1.750 contains R.750top)
  const T_R750top_R1750 = ptOn(C.R1750.c[0], C.R1750.c[1], C.R1750.r, 90) // (0.750, 0.9375)

  // R.875rb / R1.375 tangent (external)
  const T_R875_R1375 = tangentPt(C.R875rb.c, C.R875rb.r, C.R1375.c)

  // R1.375 / D1750 tangent (external)
  const T_R1375_D1750 = tangentPt(C.R1375.c, C.R1375.r, C.D1750.c)

  // D1750 / R.437 tangent (external)
  const T_D1750_R437 = tangentPt(C.D1750.c, C.D1750.r, C.R437.c)

  // R.437 / R.750bot tangent (external)
  const T_R437_R750 = tangentPt(C.R437.c, C.R437.r, C.R750bot.c)

  console.log('[15] Tangent points:')
  console.log('  R875/R1375:', T_R875_R1375.map(v => v.toFixed(3)))
  console.log('  R1375/D1750:', T_R1375_D1750.map(v => v.toFixed(3)))
  console.log('  D1750/R437:', T_D1750_R437.map(v => v.toFixed(3)))
  console.log('  R437/R750:', T_R437_R750.map(v => v.toFixed(3)))

  // === BUILD OUTLINE ===
  const leftTop = [0, 0.1875]
  const leftBot = [0, -0.1875]
  const bossTop = T_R750top_R1750

  // R1.750 end: extend to where it meets the top-right connecting line
  // For now, end R1.750 at 45°
  const r1750End = ptOn(C.R1750.c[0], C.R1750.c[1], C.R1750.r, 45)

  // R.875 top entry: use rbEntry at 135°
  const rbEntry = ptOn(C.R875rb.c[0], C.R875rb.c[1], C.R875rb.r, 135)
  const rbTop = ptOn(C.R875rb.c[0], C.R875rb.c[1], C.R875rb.r, 90)
  const rbRight = ptOn(C.R875rb.c[0], C.R875rb.c[1], C.R875rb.r, 0)

  // 1. Left edge
  const s1 = await mk('S1')
  await api.v1.curve.line({ id: s1, startPos: p(leftBot), endPos: p(leftTop) })

  // 2. Left top R.750 quarter arc
  const s2 = await mk('S2')
  const r750TopMid = ptOn(C.R750top.c[0], C.R750top.c[1], C.R750top.r, 135)
  await api.v1.curve.arcBy3Points({ id: s2, startPos: p(leftTop), midPos: p(r750TopMid), endPos: p(bossTop) })

  // 3. R1.750 arc from boss top to 45°
  const s3 = await mk('S3')
  const r1750Mid = ptOn(C.R1750.c[0], C.R1750.c[1], C.R1750.r, 67.5)
  await api.v1.curve.arcBy3Points({ id: s3, startPos: p(bossTop), midPos: p(r1750Mid), endPos: p(r1750End) })

  // 4. Line from R1.750 to R.875 entry (top right connection — still simplified)
  const s4 = await mk('S4')
  await api.v1.curve.line({ id: s4, startPos: p(r1750End), endPos: p(rbEntry) })

  // 5a. R.875 upper: from entry (135°) → top (90°) → right (0°)
  const s5a = await mk('S5a')
  await api.v1.curve.arcBy3Points({ id: s5a, startPos: p(rbEntry), midPos: p(rbTop), endPos: p(rbRight) })

  // 5b. R.875 lower: from right (0°) → tangent with R1.375
  const s5b = await mk('S5b')
  // Midpoint: halfway between 0° and the angle of T_R875_R1375
  const angleR875exit = Math.atan2(T_R875_R1375[1] - C.R875rb.c[1], T_R875_R1375[0] - C.R875rb.c[0]) * 180/Math.PI
  const r875LoMid = ptOn(C.R875rb.c[0], C.R875rb.c[1], C.R875rb.r, angleR875exit / 2)
  await api.v1.curve.arcBy3Points({ id: s5b, startPos: p(rbRight), midPos: p(r875LoMid), endPos: p(T_R875_R1375) })

  // 6. R1.375 arc: from tangent with R.875 to tangent with D1750
  const s6 = await mk('S6')
  const a1 = Math.atan2(T_R875_R1375[1]-C.R1375.c[1], T_R875_R1375[0]-C.R1375.c[0]) * 180/Math.PI
  const a2 = Math.atan2(T_R1375_D1750[1]-C.R1375.c[1], T_R1375_D1750[0]-C.R1375.c[0]) * 180/Math.PI
  const r1375Mid = ptOn(C.R1375.c[0], C.R1375.c[1], C.R1375.r, (a1+a2)/2)
  await api.v1.curve.arcBy3Points({ id: s6, startPos: p(T_R875_R1375), midPos: p(r1375Mid), endPos: p(T_R1375_D1750) })

  // 7. D1750 arc: from tangent with R1.375 to tangent with R.437
  const s7 = await mk('S7')
  const b1 = Math.atan2(T_R1375_D1750[1]-C.D1750.c[1], T_R1375_D1750[0]-C.D1750.c[0]) * 180/Math.PI
  const b2 = Math.atan2(T_D1750_R437[1]-C.D1750.c[1], T_D1750_R437[0]-C.D1750.c[0]) * 180/Math.PI
  const d1750Mid = ptOn(C.D1750.c[0], C.D1750.c[1], C.D1750.r, (b1+b2)/2)
  await api.v1.curve.arcBy3Points({ id: s7, startPos: p(T_R1375_D1750), midPos: p(d1750Mid), endPos: p(T_D1750_R437) })

  // 8. R.437 fillet arc: from tangent with D1750 to tangent with R.750bot
  const s8 = await mk('S8')
  const c1_ = Math.atan2(T_D1750_R437[1]-C.R437.c[1], T_D1750_R437[0]-C.R437.c[0]) * 180/Math.PI
  const c2_ = Math.atan2(T_R437_R750[1]-C.R437.c[1], T_R437_R750[0]-C.R437.c[0]) * 180/Math.PI
  const r437Mid = ptOn(C.R437.c[0], C.R437.c[1], C.R437.r, (c1_+c2_)/2)
  await api.v1.curve.arcBy3Points({ id: s8, startPos: p(T_D1750_R437), midPos: p(r437Mid), endPos: p(T_R437_R750) })

  // 9. R.750 bottom arc: from tangent with R.437 to left edge bottom
  const s9 = await mk('S9')
  const d1 = Math.atan2(T_R437_R750[1]-C.R750bot.c[1], T_R437_R750[0]-C.R750bot.c[0]) * 180/Math.PI
  const r750BotMid = ptOn(C.R750bot.c[0], C.R750bot.c[1], C.R750bot.r, (d1 + 180) / 2)
  await api.v1.curve.arcBy3Points({ id: s9, startPos: p(T_R437_R750), midPos: p(r750BotMid), endPos: p(leftBot) })

  // === SLOT ===
  const slot = await mk('Slot')
  await api.v1.curve.arcBy3Points({ id: slot,
    startPos: [1.250*IN, -0.500*IN, 0], midPos: [1.750*IN, 0, 0], endPos: [1.250*IN, 0.500*IN, 0] })
  await api.v1.curve.line({ id: slot, startPos: [1.250*IN, 0.500*IN, 0], endPos: [0.750*IN, 0.500*IN, 0] })
  await api.v1.curve.arcBy3Points({ id: slot,
    startPos: [0.750*IN, 0.500*IN, 0], midPos: [0.250*IN, 0, 0], endPos: [0.750*IN, -0.500*IN, 0] })
  await api.v1.curve.line({ id: slot, startPos: [0.750*IN, -0.500*IN, 0], endPos: [1.250*IN, -0.500*IN, 0] })

  // === HOLES ===
  const h1 = await mk('H1625')
  await api.v1.curve.circle({ id: h1, centerPos: [2.500*IN, 0.350*IN, 0], radius: 0.8125*IN })
  const h2 = await mk('H0750')
  await api.v1.curve.circle({ id: h2, centerPos: [3.250*IN, 0.350*IN, 0], radius: 0.375*IN })
  const h3 = await mk('H1125')
  await api.v1.curve.circle({ id: h3, centerPos: [3.750*IN, -0.200*IN, 0], radius: 0.5625*IN })

  // Centerline
  const ref = await mk('Ref')
  await api.v1.curve.line({ id: ref, startPos: [-0.5*IN, 0, 0], endPos: [6.5*IN, 0, 0] })

  await snapshot('tangent-chain-v1')
  console.log('[15] Bottom outline: R.750bot → R.437 → D1750 → R1.375 → R.875')
}
