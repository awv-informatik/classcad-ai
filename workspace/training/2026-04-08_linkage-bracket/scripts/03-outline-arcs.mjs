// 03 — Place outline construction circles to understand the bracket shape
// All dimensions in mm (inch * 25.4)
// Goal: visualize where the outline arcs are and how they connect
const IN = 25.4

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OutlineArcs' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'Outline' })).result

  // === LEFT BOSS OUTLINE ===
  // Height at left = 1.875" → top at +0.9375", bottom at -0.9375"
  // 2x R.750 arcs form the left boss curvature
  // Arc centers derived: if tangent to y=±0.9375 with R=0.750:
  //   Top arc center: (0.750, +0.1875)
  //   Bottom arc center: (0.750, -0.1875)
  const leftTop = (await api.v1.curve.shape({ id: eifId, name: 'LeftTop_R750' })).result
  await api.v1.curve.circle({ id: leftTop, centerPos: [0.750*IN, 0.1875*IN, 0], radius: 0.750*IN })

  const leftBot = (await api.v1.curve.shape({ id: eifId, name: 'LeftBot_R750' })).result
  await api.v1.curve.circle({ id: leftBot, centerPos: [0.750*IN, -0.1875*IN, 0], radius: 0.750*IN })

  // === TOP ARC R1.750 ===
  // Large arc connecting left boss to center/right area
  // For internal tangency with top R.750:
  //   distance = R1.750 - R.750 = 1.000"
  //   center at distance 1.000 from (0.750, 0.1875), direction toward center of bracket
  // Try center at (1.650, -0.250): verified distance ≈ 1.000
  // Top of arc at y = -0.250 + 1.750 = 1.500"
  const topArc = (await api.v1.curve.shape({ id: eifId, name: 'Top_R1750' })).result
  await api.v1.curve.circle({ id: topArc, centerPos: [1.650*IN, -0.250*IN, 0], radius: 1.750*IN })

  // === BOTTOM CENTER ARC Ø1.750 (R=0.875) ===
  // Bottom outline arc. Center at (2.617, cy) where cy is below centerline.
  // Try cy = -0.750 (the bottom of this arc at y = -0.750 - 0.875 = -1.625)
  const botCenter = (await api.v1.curve.shape({ id: eifId, name: 'Bot_D1750' })).result
  await api.v1.curve.circle({ id: botCenter, centerPos: [2.617*IN, -0.750*IN, 0], radius: 0.875*IN })

  // === BOTTOM-LEFT TRANSITION R.437 (2x) ===
  // Fillets connecting left boss bottom to bottom center arc
  // For external tangency with left-bot R.750: distance = 0.750 + 0.437 = 1.187
  // For external tangency with Ø1.750 R.875: distance = 0.875 + 0.437 = 1.312
  // Estimate center at ~(1.500, -1.100)
  const fillet1 = (await api.v1.curve.shape({ id: eifId, name: 'BotLeft_R437' })).result
  await api.v1.curve.circle({ id: fillet1, centerPos: [1.500*IN, -1.100*IN, 0], radius: 0.437*IN })

  // === BOTTOM-RIGHT ARC R1.375 ===
  // Large arc at bottom-right connecting center to right boss
  // Try center at (4.200, 0.200)
  const botRight = (await api.v1.curve.shape({ id: eifId, name: 'BotRight_R1375' })).result
  await api.v1.curve.circle({ id: botRight, centerPos: [4.200*IN, 0.200*IN, 0], radius: 1.375*IN })

  // === RIGHT BOSS R.875 (2x) ===
  // Right boss outline arcs. Boss center at ~(4.929, 0)
  // Two arcs (top and bottom) wrapping around the right slot
  const rightTop = (await api.v1.curve.shape({ id: eifId, name: 'RightTop_R875' })).result
  await api.v1.curve.circle({ id: rightTop, centerPos: [4.929*IN, 0.200*IN, 0], radius: 0.875*IN })

  const rightBot = (await api.v1.curve.shape({ id: eifId, name: 'RightBot_R875' })).result
  await api.v1.curve.circle({ id: rightBot, centerPos: [4.929*IN, -0.200*IN, 0], radius: 0.875*IN })

  // === LEFT SLOT for reference ===
  const slot = (await api.v1.curve.shape({ id: eifId, name: 'LeftSlot' })).result
  await api.v1.curve.polyline2d({
    id: slot,
    points: [
      [0.625*IN, -0.750*IN, 0],
      [1.375*IN, -0.750*IN, 0],
      [1.375*IN,  0.750*IN, 0],
      [0.625*IN,  0.750*IN, 0],
    ],
    bulges: [0, 1, 0, 1],
    close: true
  })

  // === REFERENCE LINES ===
  const ref = (await api.v1.curve.shape({ id: eifId, name: 'Ref' })).result
  await api.v1.curve.line({ id: ref, startPos: [-0.3*IN, 0, 0], endPos: [6.2*IN, 0, 0] })
  await api.v1.curve.line({ id: ref, startPos: [0, -2*IN, 0], endPos: [0, 2*IN, 0] })
  await api.v1.curve.line({ id: ref, startPos: [5.804*IN, -2*IN, 0], endPos: [5.804*IN, 2*IN, 0] })

  await snapshot('outline-circles-v1')

  console.log('[03] Outline circles placed:')
  console.log('  Left R.750 arcs: (0.750, ±0.1875)')
  console.log('  Top R1.750: (1.650, -0.250), top at y=1.500"')
  console.log('  Bottom Ø1.750: (2.617, -0.750)')
  console.log('  BotLeft R.437: (1.500, -1.100)')
  console.log('  BotRight R1.375: (4.200, 0.200)')
  console.log('  Right R.875: (4.929, ±0.200)')
}
