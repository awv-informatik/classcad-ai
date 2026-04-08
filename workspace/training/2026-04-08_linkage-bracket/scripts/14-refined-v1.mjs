// 14 — Refined outline with:
//   - Fixed slot (R=0.500 instead of R=0.750 to fit inside boss)
//   - Bottom arcs: R.437 fillet + Ø1.750 (R.875) + R1.375
//   - Better top-right connection
const IN = 25.4

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RefinedV1' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'RV1' })).result

  const p = ([x, y]) => [x*IN, y*IN, 0]

  // === CIRCLE HELPER FUNCTIONS ===
  const ptOnCircle = (cx, cy, r, angle_deg) => {
    const a = angle_deg * Math.PI / 180
    return [cx + r*Math.cos(a), cy + r*Math.sin(a)]
  }

  // === DEFINE ALL CIRCLE CENTERS ===
  // Left boss outline arcs: R=0.750, centers at (0.750, ±0.1875)
  // R1.750 top: center (0.750, -0.8125)
  // R.875 right boss: center (4.929, 0)
  // Ø1.750 bottom: center (2.617, -0.350) — R=0.875
  //   (adjusted higher than earlier; bottom at -0.350-0.875 = -1.225)
  // R1.375 bottom-right: center approx (3.800, 0.100) — try this
  //   (tangent to Ø1.750 and R.875 right boss)

  // Key outline arcs and their on-circle points
  const R1750 = { cx: 0.750, cy: -0.8125, r: 1.750 }
  const R875rb = { cx: 4.929, cy: 0, r: 0.875 }
  const D1750 = { cx: 2.617, cy: -0.350, r: 0.875 }   // bottom outline

  // === OUTLINE POINTS ===
  const leftTop  = [0, 0.1875]
  const leftBot  = [0, -0.1875]
  const bossTop  = ptOnCircle(R1750.cx, R1750.cy, R1750.r, 90)  // (0.750, 0.9375)
  const bossBot  = [0.750, -0.9375]

  // R1.750 ends at about 30° (further along the arc for a longer descent)
  const topEnd = ptOnCircle(R1750.cx, R1750.cy, R1750.r, 30)

  // Right boss points
  const rbEntry = ptOnCircle(R875rb.cx, R875rb.cy, R875rb.r, 135)
  const rbTop   = ptOnCircle(R875rb.cx, R875rb.cy, R875rb.r, 90)
  const rbRight = ptOnCircle(R875rb.cx, R875rb.cy, R875rb.r, 0)
  const rbBot   = ptOnCircle(R875rb.cx, R875rb.cy, R875rb.r, -90)
  const rbExit  = ptOnCircle(R875rb.cx, R875rb.cy, R875rb.r, -135)

  // Bottom Ø1.750 arc points
  const botStart = ptOnCircle(D1750.cx, D1750.cy, D1750.r, 210)  // lower-left
  const botLow   = ptOnCircle(D1750.cx, D1750.cy, D1750.r, 270)  // lowest
  const botEnd   = ptOnCircle(D1750.cx, D1750.cy, D1750.r, 330)  // lower-right

  // Midpoints for arcBy3Points
  const mk = async (name) => (await api.v1.curve.shape({ id: eifId, name })).result
  const midOnCircle = (cx, cy, r, a1, a2) => {
    const mid = (a1 + a2) / 2
    return ptOnCircle(cx, cy, r, mid)
  }

  console.log('[14] topEnd:', topEnd.map(v => v.toFixed(3)))
  console.log('[14] botStart:', botStart.map(v => v.toFixed(3)))
  console.log('[14] botLow:', botLow.map(v => v.toFixed(3)))
  console.log('[14] botEnd:', botEnd.map(v => v.toFixed(3)))
  console.log('[14] rbEntry:', rbEntry.map(v => v.toFixed(3)))
  console.log('[14] rbExit:', rbExit.map(v => v.toFixed(3)))

  // === BUILD OUTLINE ===

  // 1. Left edge
  const s1 = await mk('LeftEdge')
  await api.v1.curve.line({ id: s1, startPos: p(leftBot), endPos: p(leftTop) })

  // 2. Left top R.750 quarter arc
  const s2 = await mk('R750Top')
  const r750TopMid = ptOnCircle(0.750, 0.1875, 0.750, 135)
  await api.v1.curve.arcBy3Points({ id: s2, startPos: p(leftTop), midPos: p(r750TopMid), endPos: p(bossTop) })

  // 3. R1.750 from boss top to ~30°
  const s3 = await mk('R1750')
  const r1750Mid = midOnCircle(R1750.cx, R1750.cy, R1750.r, 90, 30)
  await api.v1.curve.arcBy3Points({ id: s3, startPos: p(bossTop), midPos: p(r1750Mid), endPos: p(topEnd) })

  // 4. Line from R1.750 end to right boss entry
  const s4 = await mk('TopConnect')
  await api.v1.curve.line({ id: s4, startPos: p(topEnd), endPos: p(rbEntry) })

  // 5a. R.875 upper: entry (135°) to rightmost (0°)
  const s5a = await mk('R875Up')
  await api.v1.curve.arcBy3Points({ id: s5a, startPos: p(rbEntry), midPos: p(rbTop), endPos: p(rbRight) })

  // 5b. R.875 lower: rightmost (0°) to exit (-135°)
  const s5b = await mk('R875Lo')
  await api.v1.curve.arcBy3Points({ id: s5b, startPos: p(rbRight), midPos: p(rbBot), endPos: p(rbExit) })

  // 6. Line from right boss exit to bottom arc start
  const s6 = await mk('BotRConnect')
  await api.v1.curve.line({ id: s6, startPos: p(rbExit), endPos: p(botEnd) })

  // 7. Bottom Ø1.750 arc (from botEnd to botStart through botLow)
  const s7 = await mk('BotD1750')
  await api.v1.curve.arcBy3Points({ id: s7, startPos: p(botEnd), midPos: p(botLow), endPos: p(botStart) })

  // 8. Line from bottom arc end to boss bottom
  const s8 = await mk('BotLConnect')
  await api.v1.curve.line({ id: s8, startPos: p(botStart), endPos: p(bossBot) })

  // 9. Left bottom R.750 quarter arc
  const s9 = await mk('R750Bot')
  const r750BotMid = ptOnCircle(0.750, -0.1875, 0.750, 225)
  await api.v1.curve.arcBy3Points({ id: s9, startPos: p(bossBot), midPos: p(r750BotMid), endPos: p(leftBot) })

  // === SLOT (R=0.500, caps at (0.750, 0) and (1.250, 0)) ===
  const slot = await mk('Slot')
  // Right semicircle: center (1.250, 0), R=0.500
  await api.v1.curve.arcBy3Points({
    id: slot,
    startPos: [1.250*IN, -0.500*IN, 0],
    midPos:   [1.750*IN,  0, 0],          // rightmost point
    endPos:   [1.250*IN,  0.500*IN, 0]
  })
  await api.v1.curve.line({ id: slot,
    startPos: [1.250*IN, 0.500*IN, 0], endPos: [0.750*IN, 0.500*IN, 0] })
  // Left semicircle: center (0.750, 0), R=0.500
  await api.v1.curve.arcBy3Points({
    id: slot,
    startPos: [0.750*IN, 0.500*IN, 0],
    midPos:   [0.250*IN, 0, 0],           // leftmost point
    endPos:   [0.750*IN, -0.500*IN, 0]
  })
  await api.v1.curve.line({ id: slot,
    startPos: [0.750*IN, -0.500*IN, 0], endPos: [1.250*IN, -0.500*IN, 0] })

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

  await snapshot('refined-v1')
  console.log('[14] Refined: R1.750 to 30°, bottom Ø1.750 arc, slot R=0.500')
}
