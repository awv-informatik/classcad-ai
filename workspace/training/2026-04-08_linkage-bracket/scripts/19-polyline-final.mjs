// 19 — polyline2d with computed bulges from tangent chain
// Uses close=true for guaranteed closure → enables boolean operations
const IN = 25.4

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PolyFinal' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'PF' })).result
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
    const dx1 = (p1[0]-cx)/r, dy1 = (p1[1]-cy)/r
    const dx2 = (p2[0]-cx)/r, dy2 = (p2[1]-cy)/r
    const mx = dx1+dx2, my = dy1+dy2
    const ml = Math.sqrt(mx*mx+my*my)
    return [cx + r*mx/ml, cy + r*my/ml]
  }

  // Compute signed bulge from start, end, and arc midpoint
  function bulge(start, end, mid) {
    const cmx = (start[0]+end[0])/2, cmy = (start[1]+end[1])/2
    const dx = end[0]-start[0], dy = end[1]-start[1]
    const halfChord = Math.sqrt(dx*dx+dy*dy)/2
    const sx = mid[0]-cmx, sy = mid[1]-cmy
    const sagitta = Math.sqrt(sx*sx+sy*sy)
    const cross = dx*sy - dy*sx  // positive = mid is LEFT of chord
    return (cross > 0 ? 1 : -1) * sagitta / halfChord
  }

  // === CIRCLES ===
  const C = {
    R750top:  { c: [0.750, 0.1875],  r: 0.750 },
    R750bot:  { c: [0.750, -0.1875], r: 0.750 },
    R1750:    { c: [0.750, -0.8125], r: 1.750 },
    R875rb:   { c: [4.929, 0.000],   r: 0.875 },
    D1750:    { c: [2.617, -0.350],  r: 0.875 },
    R1375:    { c: [4.062, -2.081],  r: 1.375 },
    R437:     { c: [1.526, -1.121],  r: 0.437 },
  }

  // === OUTLINE POINTS (in order, CCW for positive area) ===
  const pts = []
  const buls = []

  // Helper: add arc segment
  const addArc = (cx, cy, r, start, end, _mid) => {
    const mid = _mid || arcMid(cx, cy, r, start, end)
    pts.push(start)
    buls.push(bulge(start, end, mid))
  }
  // Helper: add line segment
  const addLine = (start) => {
    pts.push(start)
    buls.push(0)
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

  // 1. Left edge line: leftBot → leftTop
  addLine(leftBot)

  // 2. R.750 top arc: leftTop → bossTop
  addArc(C.R750top.c[0], C.R750top.c[1], C.R750top.r, leftTop, bossTop)

  // 3. R1.750 arc: bossTop → r1750End
  addArc(C.R1750.c[0], C.R1750.c[1], C.R1750.r, bossTop, r1750End)

  // 4. Line: r1750End → rbEntry
  addLine(r1750End)

  // 5a. R.875 upper: rbEntry → rbRight (via rbTop)
  addArc(C.R875rb.c[0], C.R875rb.c[1], C.R875rb.r, rbEntry, rbRight, rbTop)

  // 5b. R.875 lower: rbRight → T_R875_R1375
  addArc(C.R875rb.c[0], C.R875rb.c[1], C.R875rb.r, rbRight, T_R875_R1375)

  // 6. R1.375: T_R875_R1375 → T_R1375_D1750
  addArc(C.R1375.c[0], C.R1375.c[1], C.R1375.r, T_R875_R1375, T_R1375_D1750)

  // 7. D1750: T_R1375_D1750 → T_D1750_R437
  addArc(C.D1750.c[0], C.D1750.c[1], C.D1750.r, T_R1375_D1750, T_D1750_R437)

  // 8. R.437: T_D1750_R437 → T_R437_R750
  addArc(C.R437.c[0], C.R437.c[1], C.R437.r, T_D1750_R437, T_R437_R750)

  // 9. R.750 bottom: T_R437_R750 → leftBot (major arc via bossBot)
  addArc(C.R750bot.c[0], C.R750bot.c[1], C.R750bot.r, T_R437_R750, leftBot, bossBot)

  console.log('[19] Points:', pts.length, 'Bulges:', buls.length)
  console.log('[19] Bulges:', buls.map(b => b.toFixed(3)).join(', '))

  // === CREATE CLOSED POLYLINE ===
  const ol = await mk('Outline')
  const r = await api.v1.curve.polyline2d({
    id: ol,
    points: pts.map(pt => p(pt)),
    bulges: buls,
    close: true
  })
  console.log('[19] polyline2d maxLevel:', r.maxLevel,
    r.messages?.length ? JSON.stringify(r.messages) : 'ok')

  // === SLOT ===
  const slot = await mk('Slot')
  await api.v1.curve.polyline2d({
    id: slot,
    points: [
      [0.750*IN, -0.500*IN, 0], [1.250*IN, -0.500*IN, 0],
      [1.250*IN,  0.500*IN, 0], [0.750*IN,  0.500*IN, 0],
    ],
    bulges: [0, -1, 0, -1],  // outward semicircles
    close: true
  })

  // === HOLE ===
  const h1 = await mk('H1625')
  await api.v1.curve.circle({ id: h1, centerPos: [2.500*IN, 0.350*IN, 0], radius: 0.8125*IN })

  // === TRY BOOLEAN ===
  console.log('[19] Attempting subtraction2d (slot from outline)...')
  const sub1 = await api.v1.curve.subtraction2d({ target: ol, tool: slot })
  console.log('[19] subtract slot:', sub1.maxLevel,
    sub1.messages?.length ? sub1.messages[0].message : 'ok')

  if (sub1.maxLevel < 50) {
    const sub2 = await api.v1.curve.subtraction2d({ target: ol, tool: h1 })
    console.log('[19] subtract H1625:', sub2.maxLevel,
      sub2.messages?.length ? sub2.messages[0].message : 'ok')
  }

  await snapshot('polyline-final')
  console.log('[19] Done')
}
