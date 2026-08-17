// 16 — Fixed midpoints for arcBy3Points (explicit, no angle averaging)
const IN = 25.4

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TangentV2' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'TV2' })).result
  const mk = async (name) => (await api.v1.curve.shape({ id: eifId, name })).result
  const p = ([x, y]) => [x*IN, y*IN, 0]

  // === HELPERS ===
  const dist = (a, b) => Math.sqrt((b[0]-a[0])**2 + (b[1]-a[1])**2)
  const ptOn = (cx, cy, r, deg) => [cx + r*Math.cos(deg*Math.PI/180), cy + r*Math.sin(deg*Math.PI/180)]
  const tangentPt = (c1, r1, c2) => {
    const d = dist(c1, c2)
    return [c1[0] + r1*(c2[0]-c1[0])/d, c1[1] + r1*(c2[1]-c1[1])/d]
  }
  // Midpoint of minor arc between two points on a circle
  const arcMid = (cx, cy, r, p1, p2) => {
    const dx1 = p1[0]-cx, dy1 = p1[1]-cy
    const dx2 = p2[0]-cx, dy2 = p2[1]-cy
    // Average the unit vectors, normalize, scale by r
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
  const T = {
    bossTop:      ptOn(C.R1750.c[0], C.R1750.c[1], C.R1750.r, 90), // (0.750, 0.9375)
    r1750End:     ptOn(C.R1750.c[0], C.R1750.c[1], C.R1750.r, 45),
    R875_R1375:   tangentPt(C.R875rb.c, C.R875rb.r, C.R1375.c),
    R1375_D1750:  tangentPt(C.R1375.c, C.R1375.r, C.D1750.c),
    D1750_R437:   tangentPt(C.D1750.c, C.D1750.r, C.R437.c),
    R437_R750:    tangentPt(C.R437.c, C.R437.r, C.R750bot.c),
  }

  const leftTop = [0, 0.1875]
  const leftBot = [0, -0.1875]
  const rbEntry = ptOn(C.R875rb.c[0], C.R875rb.c[1], C.R875rb.r, 135)
  const rbTop   = ptOn(C.R875rb.c[0], C.R875rb.c[1], C.R875rb.r, 90)
  const rbRight = ptOn(C.R875rb.c[0], C.R875rb.c[1], C.R875rb.r, 0)

  console.log('[16] Tangent points:')
  console.log('  bossTop:', T.bossTop.map(v => v.toFixed(3)))
  console.log('  r1750End:', T.r1750End.map(v => v.toFixed(3)))
  console.log('  R875/R1375:', T.R875_R1375.map(v => v.toFixed(3)))
  console.log('  R1375/D1750:', T.R1375_D1750.map(v => v.toFixed(3)))
  console.log('  D1750/R437:', T.D1750_R437.map(v => v.toFixed(3)))
  console.log('  R437/R750:', T.R437_R750.map(v => v.toFixed(3)))

  // === OUTLINE SEGMENTS ===

  // 1. Left edge
  const s1 = await mk('S1')
  await api.v1.curve.line({ id: s1, startPos: p(leftBot), endPos: p(leftTop) })

  // 2. Left top R.750 (leftTop → bossTop)
  const s2 = await mk('S2')
  await api.v1.curve.arcBy3Points({ id: s2,
    startPos: p(leftTop),
    midPos: p(arcMid(C.R750top.c[0], C.R750top.c[1], C.R750top.r, leftTop, T.bossTop)),
    endPos: p(T.bossTop)
  })

  // 3. R1.750 (bossTop → r1750End at 45°)
  const s3 = await mk('S3')
  await api.v1.curve.arcBy3Points({ id: s3,
    startPos: p(T.bossTop),
    midPos: p(arcMid(C.R1750.c[0], C.R1750.c[1], C.R1750.r, T.bossTop, T.r1750End)),
    endPos: p(T.r1750End)
  })

  // 4. Line: r1750End → rbEntry (top-right connection, still simplified)
  const s4 = await mk('S4')
  await api.v1.curve.line({ id: s4, startPos: p(T.r1750End), endPos: p(rbEntry) })

  // 5a. R.875 upper (rbEntry → rbRight)
  const s5a = await mk('S5a')
  await api.v1.curve.arcBy3Points({ id: s5a,
    startPos: p(rbEntry), midPos: p(rbTop), endPos: p(rbRight) })

  // 5b. R.875 lower (rbRight → T.R875_R1375)
  const s5b = await mk('S5b')
  await api.v1.curve.arcBy3Points({ id: s5b,
    startPos: p(rbRight),
    midPos: p(arcMid(C.R875rb.c[0], C.R875rb.c[1], C.R875rb.r, rbRight, T.R875_R1375)),
    endPos: p(T.R875_R1375)
  })

  // 6. R1.375 (T.R875_R1375 → T.R1375_D1750)
  const s6 = await mk('S6')
  await api.v1.curve.arcBy3Points({ id: s6,
    startPos: p(T.R875_R1375),
    midPos: p(arcMid(C.R1375.c[0], C.R1375.c[1], C.R1375.r, T.R875_R1375, T.R1375_D1750)),
    endPos: p(T.R1375_D1750)
  })

  // 7. D1750 (T.R1375_D1750 → T.D1750_R437)
  const s7 = await mk('S7')
  await api.v1.curve.arcBy3Points({ id: s7,
    startPos: p(T.R1375_D1750),
    midPos: p(arcMid(C.D1750.c[0], C.D1750.c[1], C.D1750.r, T.R1375_D1750, T.D1750_R437)),
    endPos: p(T.D1750_R437)
  })

  // 8. R.437 fillet (T.D1750_R437 → T.R437_R750)
  const s8 = await mk('S8')
  // For R.437 fillet: center is BELOW the outline, arc is the upper portion
  // Use arcMid which gives the minor arc midpoint
  await api.v1.curve.arcBy3Points({ id: s8,
    startPos: p(T.D1750_R437),
    midPos: p(arcMid(C.R437.c[0], C.R437.c[1], C.R437.r, T.D1750_R437, T.R437_R750)),
    endPos: p(T.R437_R750)
  })

  // 9. R.750 bottom (T.R437_R750 → leftBot)
  // IMPORTANT: this is the MAJOR arc (going via bossBot at 270°), not the minor arc
  // Use bossBot as midpoint explicitly
  const s9 = await mk('S9')
  const bossBot = ptOn(C.R750bot.c[0], C.R750bot.c[1], C.R750bot.r, 270) // (0.750, -0.9375)
  await api.v1.curve.arcBy3Points({ id: s9,
    startPos: p(T.R437_R750),
    midPos: p(bossBot),
    endPos: p(leftBot)
  })

  // === SLOT (R=0.500) ===
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

  const ref = await mk('Ref')
  await api.v1.curve.line({ id: ref, startPos: [-0.5*IN, 0, 0], endPos: [6.5*IN, 0, 0] })

  await snapshot('tangent-v2')
  console.log('[16] Fixed midpoints: arcMid for minor arcs, explicit bossBot for R.750 major arc')
}
