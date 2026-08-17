// 13 — Use arcBy3Points for all arcs (no isClockwise ambiguity)
// midPos uniquely defines which arc to use
const IN = 25.4

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Arc3Pt' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'A3P' })).result

  const p = ([x, y]) => [x*IN, y*IN, 0]

  // Precompute exact points on R1.750 circle (center 0.750, -0.8125, R=1.750)
  const r1750 = (angle_deg) => {
    const a = angle_deg * Math.PI / 180
    return [0.750 + 1.750*Math.cos(a), -0.8125 + 1.750*Math.sin(a)]
  }
  // Precompute exact points on R.875 circle (center 4.929, 0, R=0.875)
  const r875 = (angle_deg) => {
    const a = angle_deg * Math.PI / 180
    return [4.929 + 0.875*Math.cos(a), 0.875*Math.sin(a)]
  }

  // Key points
  const leftTop  = [0, 0.1875]
  const leftBot  = [0, -0.1875]
  const bossTop  = r1750(90)      // (0.750, 0.9375) — top of left boss
  const bossBot  = [0.750, -0.9375]
  const topEnd   = r1750(45)      // R1.750 at 45°
  const rbEntry  = r875(135)      // R.875 at 135°
  const rbTop    = r875(90)       // (4.929, 0.875)
  const rbRight  = r875(0)        // (5.804, 0)
  const rbBot    = r875(-90)      // (4.929, -0.875)
  const rbExit   = r875(-135)     // mirror of entry
  const botCenter = [2.500, -1.000]

  // Midpoints for arcBy3Points
  const r750TopMid = [0.750 - 0.750*Math.cos(45*Math.PI/180),
                      0.1875 + 0.750*Math.sin(45*Math.PI/180)]  // R.750 top arc at 135°
  const r1750Mid = r1750(67.5)    // midpoint of R1.750 arc (90° to 45° → mid at 67.5°)
  const r875UpMid = r875(67.5)    // midpoint of upper R.875 (135° to 0° → mid at ~67.5°)
  const r875LoMid = r875(-67.5)   // midpoint of lower R.875 (0° to -135° → mid at -67.5°)
  const r750BotMid = [0.750 - 0.750*Math.cos(45*Math.PI/180),
                      -0.1875 - 0.750*Math.sin(45*Math.PI/180)] // R.750 bot arc at 225°

  console.log('[13] Key points:')
  console.log('  bossTop:', bossTop.map(v => v.toFixed(4)))
  console.log('  topEnd:', topEnd.map(v => v.toFixed(4)))
  console.log('  rbEntry:', rbEntry.map(v => v.toFixed(4)))
  console.log('  rbRight:', rbRight.map(v => v.toFixed(4)))
  console.log('  rbExit:', rbExit.map(v => v.toFixed(4)))

  // === BUILD OUTLINE (each segment in own shape for reliable rendering) ===

  // 1. Left edge line
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result
  await api.v1.curve.line({ id: s1, startPos: p(leftBot), endPos: p(leftTop) })

  // 2. Left top R.750 quarter arc
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'S2' })).result
  await api.v1.curve.arcBy3Points({ id: s2, startPos: p(leftTop), midPos: p(r750TopMid), endPos: p(bossTop) })

  // 3. R1.750 arc from boss top to ~45°
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'S3' })).result
  await api.v1.curve.arcBy3Points({ id: s3, startPos: p(bossTop), midPos: p(r1750Mid), endPos: p(topEnd) })

  // 4. Line to right boss entry
  const s4 = (await api.v1.curve.shape({ id: eifId, name: 'S4' })).result
  await api.v1.curve.line({ id: s4, startPos: p(topEnd), endPos: p(rbEntry) })

  // 5a. R.875 upper: from entry (135°) to rightmost (0°)
  const s5a = (await api.v1.curve.shape({ id: eifId, name: 'S5a' })).result
  await api.v1.curve.arcBy3Points({ id: s5a, startPos: p(rbEntry), midPos: p(rbTop), endPos: p(rbRight) })

  // 5b. R.875 lower: from rightmost (0°) to exit (-135°)
  const s5b = (await api.v1.curve.shape({ id: eifId, name: 'S5b' })).result
  await api.v1.curve.arcBy3Points({ id: s5b, startPos: p(rbRight), midPos: p(rbBot), endPos: p(rbExit) })

  // 6. Line to bottom center
  const s6 = (await api.v1.curve.shape({ id: eifId, name: 'S6' })).result
  await api.v1.curve.line({ id: s6, startPos: p(rbExit), endPos: p(botCenter) })

  // 7. Line to boss bottom
  const s7 = (await api.v1.curve.shape({ id: eifId, name: 'S7' })).result
  await api.v1.curve.line({ id: s7, startPos: p(botCenter), endPos: p(bossBot) })

  // 8. Left bottom R.750 quarter arc
  const s8 = (await api.v1.curve.shape({ id: eifId, name: 'S8' })).result
  await api.v1.curve.arcBy3Points({ id: s8, startPos: p(bossBot), midPos: p(r750BotMid), endPos: p(leftBot) })

  // === SLOT ===
  const slot = (await api.v1.curve.shape({ id: eifId, name: 'Slot' })).result
  await api.v1.curve.arcByCenter({
    id: slot, centerPos: [1.375*IN, 0, 0],
    startPos: [1.375*IN, -0.750*IN, 0], endPos: [1.375*IN, 0.750*IN, 0],
    isClockwise: false
  })
  await api.v1.curve.line({ id: slot, startPos: [1.375*IN, 0.750*IN, 0], endPos: [0.625*IN, 0.750*IN, 0] })
  await api.v1.curve.arcByCenter({
    id: slot, centerPos: [0.625*IN, 0, 0],
    startPos: [0.625*IN, 0.750*IN, 0], endPos: [0.625*IN, -0.750*IN, 0],
    isClockwise: false
  })
  await api.v1.curve.line({ id: slot, startPos: [0.625*IN, -0.750*IN, 0], endPos: [1.375*IN, -0.750*IN, 0] })

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

  await snapshot('arc3pt-v1')
  console.log('[13] All arcs using arcBy3Points — should have correct arc direction')
}
