// 18 — Try cleanShape before booleans to close the outline loop
const IN = 25.4

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CleanBool' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'CB' })).result
  const mk = async (name) => (await api.v1.curve.shape({ id: eifId, name })).result
  const p = ([x, y]) => [x*IN, y*IN, 0]

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

  const C = {
    R750top:  { c: [0.750, 0.1875],  r: 0.750 },
    R750bot:  { c: [0.750, -0.1875], r: 0.750 },
    R1750:    { c: [0.750, -0.8125], r: 1.750 },
    R875rb:   { c: [4.929, 0.000],   r: 0.875 },
    D1750:    { c: [2.617, -0.350],  r: 0.875 },
    R1375:    { c: [4.062, -2.081],  r: 1.375 },
    R437:     { c: [1.526, -1.121],  r: 0.437 },
  }

  const bossTop = ptOn(C.R1750.c[0], C.R1750.c[1], C.R1750.r, 90)
  const r1750End = ptOn(C.R1750.c[0], C.R1750.c[1], C.R1750.r, 45)
  const rbEntry = ptOn(C.R875rb.c[0], C.R875rb.c[1], C.R875rb.r, 135)
  const rbTop = ptOn(C.R875rb.c[0], C.R875rb.c[1], C.R875rb.r, 90)
  const rbRight = ptOn(C.R875rb.c[0], C.R875rb.c[1], C.R875rb.r, 0)
  const T_R875_R1375 = tangentPt(C.R875rb.c, C.R875rb.r, C.R1375.c)
  const T_R1375_D1750 = tangentPt(C.R1375.c, C.R1375.r, C.D1750.c)
  const T_D1750_R437 = tangentPt(C.D1750.c, C.D1750.r, C.R437.c)
  const T_R437_R750 = tangentPt(C.R437.c, C.R437.r, C.R750bot.c)
  const bossBot = ptOn(C.R750bot.c[0], C.R750bot.c[1], C.R750bot.r, 270)
  const leftTop = [0, 0.1875]
  const leftBot = [0, -0.1875]

  // === BUILD OUTLINE ===
  const ol = await mk('Outline')

  await api.v1.curve.line({ id: ol, startPos: p(leftBot), endPos: p(leftTop) })
  await api.v1.curve.arcBy3Points({ id: ol, startPos: p(leftTop),
    midPos: p(arcMid(C.R750top.c[0], C.R750top.c[1], C.R750top.r, leftTop, bossTop)),
    endPos: p(bossTop) })
  await api.v1.curve.arcBy3Points({ id: ol, startPos: p(bossTop),
    midPos: p(arcMid(C.R1750.c[0], C.R1750.c[1], C.R1750.r, bossTop, r1750End)),
    endPos: p(r1750End) })
  await api.v1.curve.line({ id: ol, startPos: p(r1750End), endPos: p(rbEntry) })
  await api.v1.curve.arcBy3Points({ id: ol, startPos: p(rbEntry), midPos: p(rbTop), endPos: p(rbRight) })
  await api.v1.curve.arcBy3Points({ id: ol, startPos: p(rbRight),
    midPos: p(arcMid(C.R875rb.c[0], C.R875rb.c[1], C.R875rb.r, rbRight, T_R875_R1375)),
    endPos: p(T_R875_R1375) })
  await api.v1.curve.arcBy3Points({ id: ol, startPos: p(T_R875_R1375),
    midPos: p(arcMid(C.R1375.c[0], C.R1375.c[1], C.R1375.r, T_R875_R1375, T_R1375_D1750)),
    endPos: p(T_R1375_D1750) })
  await api.v1.curve.arcBy3Points({ id: ol, startPos: p(T_R1375_D1750),
    midPos: p(arcMid(C.D1750.c[0], C.D1750.c[1], C.D1750.r, T_R1375_D1750, T_D1750_R437)),
    endPos: p(T_D1750_R437) })
  await api.v1.curve.arcBy3Points({ id: ol, startPos: p(T_D1750_R437),
    midPos: p(arcMid(C.R437.c[0], C.R437.c[1], C.R437.r, T_D1750_R437, T_R437_R750)),
    endPos: p(T_R437_R750) })
  await api.v1.curve.arcBy3Points({ id: ol, startPos: p(T_R437_R750), midPos: p(bossBot), endPos: p(leftBot) })

  // Try cleanShape
  console.log('[18] Calling cleanShape on outline...')
  const cleanR = await api.v1.curve.cleanShape({ id: ol })
  console.log('[18] cleanShape result:', cleanR.maxLevel,
    cleanR.messages?.length ? cleanR.messages.map(m => m.message).join('; ') : 'no messages')

  // Now try a simple subtraction with a hole
  const h1 = await mk('H1625')
  await api.v1.curve.circle({ id: h1, centerPos: [2.500*IN, 0.350*IN, 0], radius: 0.8125*IN })

  console.log('[18] Attempting subtraction2d after cleanShape...')
  const subR = await api.v1.curve.subtraction2d({ target: ol, tool: h1 })
  console.log('[18] subtraction result:', subR.maxLevel,
    subR.messages?.length ? subR.messages.map(m => m.message).join('; ') : 'ok')

  await snapshot('clean-bool')
  console.log('[18] Done')
}
