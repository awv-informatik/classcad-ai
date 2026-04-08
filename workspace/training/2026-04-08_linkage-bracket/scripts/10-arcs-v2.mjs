// 10 — Arcs outline V2: split R.875 into two arcs, add error checking
const IN = 25.4

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcsV2' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'V2' })).result

  const ol = (await api.v1.curve.shape({ id: eifId, name: 'Outline' })).result

  // Helper to log errors
  const log = (label, r) => {
    if (r.maxLevel > 40) console.log(`[!] ${label}: maxLevel=${r.maxLevel}`, JSON.stringify(r.messages))
  }

  // Key points (in inches, converted to mm on use)
  const P = {
    leftTop:    [0,     0.1875],
    leftBot:    [0,    -0.1875],
    bossTop:    [0.750, 0.9375],
    bossBot:    [0.750,-0.9375],
    r1750End:   [2.000, 0.413],
    rbTop:      [4.929, 0.875],    // R.875 at 90°
    rbRight:    [5.804, 0.000],    // R.875 at 0° (rightmost)
    rbBot:      [4.929,-0.875],    // R.875 at -90°
    rbEntry:    [4.310, 0.619],    // R.875 at 135°
    rbExit:     [4.310,-0.619],    // R.875 at -135°
    botCenter:  [2.500,-1.000],
  }
  const p = (pt) => [pt[0]*IN, pt[1]*IN, 0]

  // === 1. Left edge line ===
  log('leftEdge', await api.v1.curve.line({ id: ol, startPos: p(P.leftBot), endPos: p(P.leftTop) }))

  // === 2. Left top R.750 quarter arc ===
  log('R750top', await api.v1.curve.arcByCenter({
    id: ol, centerPos: [0.750*IN, 0.1875*IN, 0],
    startPos: p(P.leftTop), endPos: p(P.bossTop), isClockwise: true
  }))

  // === 3. R1.750 arc from boss top descending right ===
  log('R1750', await api.v1.curve.arcByCenter({
    id: ol, centerPos: [0.750*IN, -0.8125*IN, 0],
    startPos: p(P.bossTop), endPos: p(P.r1750End), isClockwise: true
  }))

  // === 4. Line from R1.750 end to right boss entry ===
  log('toRB', await api.v1.curve.line({ id: ol, startPos: p(P.r1750End), endPos: p(P.rbEntry) }))

  // === 5a. R.875 upper half: from entry (135°) to rightmost (0°) = 135° CW ===
  log('R875upper', await api.v1.curve.arcByCenter({
    id: ol, centerPos: [4.929*IN, 0, 0],
    startPos: p(P.rbEntry), endPos: p(P.rbRight), isClockwise: true
  }))

  // === 5b. R.875 lower half: from rightmost (0°) to exit (-135°) = 135° CW ===
  log('R875lower', await api.v1.curve.arcByCenter({
    id: ol, centerPos: [4.929*IN, 0, 0],
    startPos: p(P.rbRight), endPos: p(P.rbExit), isClockwise: true
  }))

  // === 6. Line from right boss exit to bottom center ===
  log('toBotCenter', await api.v1.curve.line({ id: ol, startPos: p(P.rbExit), endPos: p(P.botCenter) }))

  // === 7. Line from bottom center to left boss bottom ===
  log('toBossBot', await api.v1.curve.line({ id: ol, startPos: p(P.botCenter), endPos: p(P.bossBot) }))

  // === 8. Left bottom R.750 quarter arc ===
  log('R750bot', await api.v1.curve.arcByCenter({
    id: ol, centerPos: [0.750*IN, -0.1875*IN, 0],
    startPos: p(P.bossBot), endPos: p(P.leftBot), isClockwise: true
  }))

  // === SLOT ===
  const slot = (await api.v1.curve.shape({ id: eifId, name: 'Slot' })).result
  await api.v1.curve.arcByCenter({
    id: slot, centerPos: [1.375*IN, 0, 0],
    startPos: [1.375*IN, -0.750*IN, 0], endPos: [1.375*IN, 0.750*IN, 0],
    isClockwise: false
  })
  await api.v1.curve.line({ id: slot,
    startPos: [1.375*IN, 0.750*IN, 0], endPos: [0.625*IN, 0.750*IN, 0] })
  await api.v1.curve.arcByCenter({
    id: slot, centerPos: [0.625*IN, 0, 0],
    startPos: [0.625*IN, 0.750*IN, 0], endPos: [0.625*IN, -0.750*IN, 0],
    isClockwise: false
  })
  await api.v1.curve.line({ id: slot,
    startPos: [0.625*IN, -0.750*IN, 0], endPos: [1.375*IN, -0.750*IN, 0] })

  // === HOLES ===
  const h1 = (await api.v1.curve.shape({ id: eifId, name: 'H1625' })).result
  await api.v1.curve.circle({ id: h1, centerPos: [2.500*IN, 0.400*IN, 0], radius: 0.8125*IN })
  const h2 = (await api.v1.curve.shape({ id: eifId, name: 'H0750' })).result
  await api.v1.curve.circle({ id: h2, centerPos: [3.250*IN, 0.400*IN, 0], radius: 0.375*IN })
  const h3 = (await api.v1.curve.shape({ id: eifId, name: 'H1125' })).result
  await api.v1.curve.circle({ id: h3, centerPos: [3.750*IN, -0.200*IN, 0], radius: 0.5625*IN })

  // Centerline
  const ref = (await api.v1.curve.shape({ id: eifId, name: 'Ref' })).result
  await api.v1.curve.line({ id: ref, startPos: [-0.5*IN, 0, 0], endPos: [6.5*IN, 0, 0] })

  await snapshot('arcs-v2')
  console.log('[10] Outline: R.875 split into two 135° arcs')
}
