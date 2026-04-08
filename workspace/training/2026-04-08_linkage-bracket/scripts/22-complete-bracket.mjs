// 22 — Complete bracket: precise tangent chain outline + boolean holes/slot
const IN = 25.4

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Bracket' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'Brk' })).result
  const mk = async (name) => (await api.v1.curve.shape({ id: eifId, name })).result
  const p = ([x, y]) => [x*IN, y*IN, 0]

  // === GEOMETRY HELPERS ===
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
    if (ml < 1e-10) return [cx, cy + r] // fallback for opposite points
    return [cx + r*mx/ml, cy + r*my/ml]
  }

  // Solve for center of circle with radius rNew tangent to two circles
  function solveTangent(c1, r1, c2, r2, rNew, pickLower = true) {
    const d1 = r1 + rNew, d2 = r2 + rNew
    const ax = 2*(c2[0]-c1[0]), ay = 2*(c2[1]-c1[1])
    const b = d1*d1 - d2*d2 - c1[0]*c1[0] + c2[0]*c2[0] - c1[1]*c1[1] + c2[1]*c2[1]
    if (Math.abs(ay) > 1e-10) {
      const k = b/ay - c1[1], m = -ax/ay
      const A = 1 + m*m, B = -2*c1[0] + 2*k*m, C = c1[0]*c1[0] + k*k - d1*d1
      const disc = B*B - 4*A*C
      if (disc < 0) throw new Error('No solution for tangent center')
      const sq = Math.sqrt(disc)
      const x1 = (-B+sq)/(2*A), y1 = (b-ax*x1)/ay
      const x2 = (-B-sq)/(2*A), y2 = (b-ax*x2)/ay
      return pickLower ? (y1 < y2 ? [x1,y1] : [x2,y2]) : (y1 > y2 ? [x1,y1] : [x2,y2])
    }
    const x = b/ax, disc = d1*d1 - (x-c1[0])**2
    const sq = Math.sqrt(disc)
    return pickLower ? [x, c1[1]-sq] : [x, c1[1]+sq]
  }

  // Compute bulge from start, end, and arc midpoint
  function bulge(start, end, mid) {
    const cmx = (start[0]+end[0])/2, cmy = (start[1]+end[1])/2
    const dx = end[0]-start[0], dy = end[1]-start[1]
    const halfChord = Math.sqrt(dx*dx+dy*dy)/2
    const sx = mid[0]-cmx, sy = mid[1]-cmy
    const sagitta = Math.sqrt(sx*sx+sy*sy)
    const cross = dx*sy - dy*sx
    return (cross > 0 ? 1 : -1) * sagitta / halfChord
  }

  // === DEFINE FIXED CIRCLES ===
  const R750top = { c: [0.750, 0.1875], r: 0.750 }
  const R750bot = { c: [0.750, -0.1875], r: 0.750 }
  const R1750   = { c: [0.750, -0.8125], r: 1.750 }
  const R875rb  = { c: [4.929, 0.000],   r: 0.875 }
  const D1750   = { c: [2.617, -0.350],  r: 0.875 }

  // === COMPUTE VARIABLE CIRCLE CENTERS (precisely) ===
  const R1375_c = solveTangent(R875rb.c, R875rb.r, D1750.c, D1750.r, 1.375, true)
  const R437_c  = solveTangent(D1750.c, D1750.r, R750bot.c, R750bot.r, 0.437, true)
  const R1375 = { c: R1375_c, r: 1.375 }
  const R437  = { c: R437_c,  r: 0.437 }

  console.log('[22] R1.375 center:', R1375.c.map(v => v.toFixed(4)))
  console.log('[22] R.437 center:', R437.c.map(v => v.toFixed(4)))

  // Verify tangencies
  console.log('[22] Verify: R875-R1375 dist=', dist(R875rb.c, R1375.c).toFixed(4), 'expected=', (0.875+1.375).toFixed(4))
  console.log('[22] Verify: R1375-D1750 dist=', dist(R1375.c, D1750.c).toFixed(4), 'expected=', (1.375+0.875).toFixed(4))
  console.log('[22] Verify: D1750-R437 dist=', dist(D1750.c, R437.c).toFixed(4), 'expected=', (0.875+0.437).toFixed(4))
  console.log('[22] Verify: R437-R750 dist=', dist(R437.c, R750bot.c).toFixed(4), 'expected=', (0.437+0.750).toFixed(4))

  // === COMPUTE TANGENT POINTS ===
  const T = {
    R750top_R1750: ptOn(R1750.c[0], R1750.c[1], R1750.r, 90), // bossTop
    R1750_end: ptOn(R1750.c[0], R1750.c[1], R1750.r, 45),     // where R1750 ends
    R875_entry: ptOn(R875rb.c[0], R875rb.c[1], R875rb.r, 135),
    R875_top: ptOn(R875rb.c[0], R875rb.c[1], R875rb.r, 90),
    R875_right: ptOn(R875rb.c[0], R875rb.c[1], R875rb.r, 0),
    R875_R1375: tangentPt(R875rb.c, R875rb.r, R1375.c),
    R1375_D1750: tangentPt(R1375.c, R1375.r, D1750.c),
    D1750_R437: tangentPt(D1750.c, D1750.r, R437.c),
    R437_R750: tangentPt(R437.c, R437.r, R750bot.c),
    bossBot: ptOn(R750bot.c[0], R750bot.c[1], R750bot.r, 270),
  }
  const leftTop = [0, 0.1875], leftBot = [0, -0.1875]

  // === BUILD OUTLINE POLYLINE ===
  const pts = []
  const buls = []
  const addArc = (cx, cy, r, start, end, _mid) => {
    const mid = _mid || arcMid(cx, cy, r, start, end)
    pts.push(start)
    buls.push(bulge(start, end, mid))
  }
  const addLine = (start) => { pts.push(start); buls.push(0) }

  // CCW outline
  addLine(leftBot)                                                                    // left edge line
  addArc(R750top.c[0], R750top.c[1], R750top.r, leftTop, T.R750top_R1750)           // R.750 top
  addArc(R1750.c[0], R1750.c[1], R1750.r, T.R750top_R1750, T.R1750_end)            // R1.750
  addLine(T.R1750_end)                                                                // line to right boss
  addArc(R875rb.c[0], R875rb.c[1], R875rb.r, T.R875_entry, T.R875_right, T.R875_top) // R.875 upper
  addArc(R875rb.c[0], R875rb.c[1], R875rb.r, T.R875_right, T.R875_R1375)            // R.875 lower
  addArc(R1375.c[0], R1375.c[1], R1375.r, T.R875_R1375, T.R1375_D1750)             // R1.375
  addArc(D1750.c[0], D1750.c[1], D1750.r, T.R1375_D1750, T.D1750_R437)             // D1750
  addArc(R437.c[0], R437.c[1], R437.r, T.D1750_R437, T.R437_R750)                  // R.437
  addArc(R750bot.c[0], R750bot.c[1], R750bot.r, T.R437_R750, leftBot, T.bossBot)    // R.750 bot (major arc via bossBot)

  console.log('[22] Outline:', pts.length, 'pts, bulges:', buls.map(b => b.toFixed(3)).join(', '))

  const ol = await mk('Outline')
  const olR = await api.v1.curve.polyline2d({
    id: ol,
    points: pts.map(pt => p(pt)),
    bulges: buls,
    close: true
  })
  console.log('[22] Outline polyline2d maxLevel:', olR.maxLevel)

  // === SLOT (R=0.500, centered at (1.000, 0)) ===
  const slot = await mk('Slot')
  await api.v1.curve.polyline2d({
    id: slot,
    points: [[0.750*IN, -0.500*IN, 0], [1.250*IN, -0.500*IN, 0],
             [1.250*IN, 0.500*IN, 0], [0.750*IN, 0.500*IN, 0]],
    bulges: [0, 1, 0, 1], // positive = outward semicircles
    close: true
  })

  // === HOLES ===
  const h1625 = await mk('H1625')
  await api.v1.curve.circle({ id: h1625, centerPos: [2.500*IN, 0.350*IN, 0], radius: 0.8125*IN })
  const h0750 = await mk('H0750')
  await api.v1.curve.circle({ id: h0750, centerPos: [3.250*IN, 0.350*IN, 0], radius: 0.375*IN })
  const h1125 = await mk('H1125')
  await api.v1.curve.circle({ id: h1125, centerPos: [3.750*IN, -0.200*IN, 0], radius: 0.5625*IN })

  // === BOOLEAN OPERATIONS ===
  console.log('[22] Boolean operations...')

  const r1 = await api.v1.curve.subtraction2d({ target: ol, tool: slot })
  console.log('[22] - slot:', r1.maxLevel <= 40 ? 'OK' : 'FAIL ' + r1.messages?.[0]?.message)

  const r2 = await api.v1.curve.subtraction2d({ target: ol, tool: h1625 })
  console.log('[22] - H1625:', r2.maxLevel <= 40 ? 'OK' : 'FAIL ' + r2.messages?.[0]?.message)

  const r3 = await api.v1.curve.subtraction2d({ target: ol, tool: h0750 })
  console.log('[22] - H0750:', r3.maxLevel <= 40 ? 'OK' : 'FAIL ' + r3.messages?.[0]?.message)

  const r4 = await api.v1.curve.subtraction2d({ target: ol, tool: h1125 })
  console.log('[22] - H1125:', r4.maxLevel <= 40 ? 'OK' : 'FAIL ' + r4.messages?.[0]?.message)

  await snapshot('complete-bracket')
  console.log('[22] Complete bracket built!')
}
