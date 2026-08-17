// 17 — All outline in a single closed shape for boolean operations
// Using arcBy3Points for all arcs, all in one shape
const IN = 25.4

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SingleShape' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'SS' })).result
  const mk = async (name) => (await api.v1.curve.shape({ id: eifId, name })).result
  const p = ([x, y]) => [x*IN, y*IN, 0]

  // === HELPERS ===
  const dist = (a, b) => Math.sqrt((b[0]-a[0])**2 + (b[1]-a[1])**2)
  const ptOn = (cx, cy, r, deg) => [cx + r*Math.cos(deg*Math.PI/180), cy + r*Math.sin(deg*Math.PI/180)]
  const tangentPt = (c1, r1, c2) => {
    const d = dist(c1, c2)
    return [c1[0] + r1*(c2[0]-c1[0])/d, c1[1] + r1*(c2[1]-c1[1])/d]
  }
  const arcMid = (cx, cy, r, p1, p2) => {
    const dx1 = p1[0]-cx, dy1 = p1[1]-cy
    const dx2 = p2[0]-cx, dy2 = p2[1]-cy
    const mx = dx1/r + dx2/r, my = dy1/r + dy2/r
    const ml = Math.sqrt(mx*mx + my*my)
    return [cx + r*mx/ml, cy + r*my/ml]
  }

  // === CIRCLE DEFINITIONS ===
  const C = {
    R750top:  { c: [0.750, 0.1875],  r: 0.750 },
    R750bot:  { c: [0.750, -0.1875], r: 0.750 },
    R1750:    { c: [0.750, -0.8125], r: 1.750 },
    R875rb:   { c: [4.929, 0.000],   r: 0.875 },
    D1750:    { c: [2.617, -0.350],  r: 0.875 },
    R1375:    { c: [4.062, -2.081],  r: 1.375 },
    R437:     { c: [1.526, -1.121],  r: 0.437 },
  }

  // === TANGENT POINTS ===
  const bossTop     = ptOn(C.R1750.c[0], C.R1750.c[1], C.R1750.r, 90)
  const r1750End    = ptOn(C.R1750.c[0], C.R1750.c[1], C.R1750.r, 45)
  const rbEntry     = ptOn(C.R875rb.c[0], C.R875rb.c[1], C.R875rb.r, 135)
  const rbTop       = ptOn(C.R875rb.c[0], C.R875rb.c[1], C.R875rb.r, 90)
  const rbRight     = ptOn(C.R875rb.c[0], C.R875rb.c[1], C.R875rb.r, 0)
  const T_R875_R1375  = tangentPt(C.R875rb.c, C.R875rb.r, C.R1375.c)
  const T_R1375_D1750 = tangentPt(C.R1375.c, C.R1375.r, C.D1750.c)
  const T_D1750_R437  = tangentPt(C.D1750.c, C.D1750.r, C.R437.c)
  const T_R437_R750   = tangentPt(C.R437.c, C.R437.r, C.R750bot.c)
  const bossBot     = ptOn(C.R750bot.c[0], C.R750bot.c[1], C.R750bot.r, 270)
  const leftTop     = [0, 0.1875]
  const leftBot     = [0, -0.1875]

  // === BUILD SINGLE OUTLINE SHAPE ===
  const ol = await mk('Outline')

  // 1. Left edge line
  await api.v1.curve.line({ id: ol, startPos: p(leftBot), endPos: p(leftTop) })

  // 2. Left top R.750
  await api.v1.curve.arcBy3Points({ id: ol,
    startPos: p(leftTop),
    midPos: p(arcMid(C.R750top.c[0], C.R750top.c[1], C.R750top.r, leftTop, bossTop)),
    endPos: p(bossTop) })

  // 3. R1.750
  await api.v1.curve.arcBy3Points({ id: ol,
    startPos: p(bossTop),
    midPos: p(arcMid(C.R1750.c[0], C.R1750.c[1], C.R1750.r, bossTop, r1750End)),
    endPos: p(r1750End) })

  // 4. Line to right boss
  await api.v1.curve.line({ id: ol, startPos: p(r1750End), endPos: p(rbEntry) })

  // 5a. R.875 upper
  await api.v1.curve.arcBy3Points({ id: ol,
    startPos: p(rbEntry), midPos: p(rbTop), endPos: p(rbRight) })

  // 5b. R.875 lower to tangent with R1.375
  await api.v1.curve.arcBy3Points({ id: ol,
    startPos: p(rbRight),
    midPos: p(arcMid(C.R875rb.c[0], C.R875rb.c[1], C.R875rb.r, rbRight, T_R875_R1375)),
    endPos: p(T_R875_R1375) })

  // 6. R1.375
  await api.v1.curve.arcBy3Points({ id: ol,
    startPos: p(T_R875_R1375),
    midPos: p(arcMid(C.R1375.c[0], C.R1375.c[1], C.R1375.r, T_R875_R1375, T_R1375_D1750)),
    endPos: p(T_R1375_D1750) })

  // 7. D1750
  await api.v1.curve.arcBy3Points({ id: ol,
    startPos: p(T_R1375_D1750),
    midPos: p(arcMid(C.D1750.c[0], C.D1750.c[1], C.D1750.r, T_R1375_D1750, T_D1750_R437)),
    endPos: p(T_D1750_R437) })

  // 8. R.437 fillet
  await api.v1.curve.arcBy3Points({ id: ol,
    startPos: p(T_D1750_R437),
    midPos: p(arcMid(C.R437.c[0], C.R437.c[1], C.R437.r, T_D1750_R437, T_R437_R750)),
    endPos: p(T_R437_R750) })

  // 9. R.750 bottom (major arc via bossBot)
  await api.v1.curve.arcBy3Points({ id: ol,
    startPos: p(T_R437_R750), midPos: p(bossBot), endPos: p(leftBot) })

  // === SLOT (separate shape for subtraction later) ===
  const slot = await mk('Slot')
  await api.v1.curve.arcBy3Points({ id: slot,
    startPos: [1.250*IN, -0.500*IN, 0], midPos: [1.750*IN, 0, 0], endPos: [1.250*IN, 0.500*IN, 0] })
  await api.v1.curve.line({ id: slot, startPos: [1.250*IN, 0.500*IN, 0], endPos: [0.750*IN, 0.500*IN, 0] })
  await api.v1.curve.arcBy3Points({ id: slot,
    startPos: [0.750*IN, 0.500*IN, 0], midPos: [0.250*IN, 0, 0], endPos: [0.750*IN, -0.500*IN, 0] })
  await api.v1.curve.line({ id: slot, startPos: [0.750*IN, -0.500*IN, 0], endPos: [1.250*IN, -0.500*IN, 0] })

  // === HOLES (separate shapes) ===
  const h1 = await mk('H1625')
  await api.v1.curve.circle({ id: h1, centerPos: [2.500*IN, 0.350*IN, 0], radius: 0.8125*IN })
  const h2 = await mk('H0750')
  await api.v1.curve.circle({ id: h2, centerPos: [3.250*IN, 0.350*IN, 0], radius: 0.375*IN })
  const h3 = await mk('H1125')
  await api.v1.curve.circle({ id: h3, centerPos: [3.750*IN, -0.200*IN, 0], radius: 0.5625*IN })

  // === BOOLEAN: subtract holes and slot from outline ===
  console.log('[17] Attempting subtraction2d...')

  // Subtract slot from outline
  const r1 = await api.v1.curve.subtraction2d({ target: ol, tool: slot })
  console.log('[17] subtract slot:', r1.maxLevel, r1.messages?.length ? JSON.stringify(r1.messages) : 'ok')

  // Subtract holes
  const r2 = await api.v1.curve.subtraction2d({ target: ol, tool: h1 })
  console.log('[17] subtract H1625:', r2.maxLevel, r2.messages?.length ? JSON.stringify(r2.messages) : 'ok')

  const r3 = await api.v1.curve.subtraction2d({ target: ol, tool: h2 })
  console.log('[17] subtract H0750:', r3.maxLevel, r3.messages?.length ? JSON.stringify(r3.messages) : 'ok')

  const r4 = await api.v1.curve.subtraction2d({ target: ol, tool: h3 })
  console.log('[17] subtract H1125:', r4.maxLevel, r4.messages?.length ? JSON.stringify(r4.messages) : 'ok')

  await snapshot('single-shape-boolean')
  console.log('[17] Single shape outline + boolean subtraction')
}
