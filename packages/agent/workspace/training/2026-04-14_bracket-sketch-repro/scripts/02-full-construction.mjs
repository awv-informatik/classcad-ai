// Script 02: Full construction geometry — circles + tangent lines + base outline
// All shapes placed at full extent for later trimming
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Bracket' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const noGen = {
    genFixation: false, genIncidence: false,
    genVertAndHoriz: false, genTangency: false,
  }

  // ====== CIRCLES ======

  // Hub center = (0, 0)
  const hub = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 50, ...noGen })).result
  const outer = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 60, ...noGen })).result

  // Bolt positions at (±25, ±25) — bolt circle ≈ 35.36
  const boltPos = [[-25, 25], [25, 25], [-25, -25], [25, -25]]
  const bossIds = [], holeIds = []
  for (const [bx, by] of boltPos) {
    bossIds.push((await api.v1.sketch.circle({ id: skId, centerPos: [bx, by, 0], radius: 13, ...noGen })).result)
    holeIds.push((await api.v1.sketch.circle({ id: skId, centerPos: [bx, by, 0], radius: 7, ...noGen })).result)
  }

  // Right boss: center (148, -2)
  const rbOuter = (await api.v1.sketch.circle({ id: skId, centerPos: [148, -2, 0], radius: 22, ...noGen })).result
  const rbInner = (await api.v1.sketch.circle({ id: skId, centerPos: [148, -2, 0], radius: 9.5, ...noGen })).result

  // Ø20 intermediate hole — estimated (80, -20)
  const midHole = (await api.v1.sketch.circle({ id: skId, centerPos: [80, -20, 0], radius: 10, ...noGen })).result

  // R25 corner circle for base bottom-left
  // Center: tangent to x = -28 and y = -57 → center at (-28+25, -57+25) = (-3, -32)
  const r25 = (await api.v1.sketch.circle({ id: skId, centerPos: [-3, -32, 0], radius: 25, ...noGen })).result

  console.log('[02] circles placed: hub=%d outer=%d rbOuter=%d rbInner=%d midHole=%d r25=%d',
    hub, outer, rbOuter, rbInner, midHole, r25)

  // ====== ARM TANGENT LINES ======

  // Upper arm: external tangent from R60 (0,0) to R22 (148,-2) — upper side
  // Computed: sin(α) = (60-22)/148.013 = 0.25674, α = 14.87°
  // θ = atan2(-2, 148) = -0.01351 rad
  // β = θ + π/2 - α = 1.29781 rad
  const beta_upper = Math.atan2(-2, 148) + Math.PI / 2 - Math.asin(38 / Math.sqrt(148 ** 2 + 2 ** 2))
  const upperStart = [60 * Math.cos(beta_upper), 60 * Math.sin(beta_upper), 0]
  const upperEnd = [148 + 22 * Math.cos(beta_upper), -2 + 22 * Math.sin(beta_upper), 0]

  console.log('[02] upper tangent: (%.1f, %.1f) → (%.1f, %.1f)',
    upperStart[0], upperStart[1], upperEnd[0], upperEnd[1])

  const upperLine = (await api.v1.sketch.line({
    id: skId, startPos: upperStart, endPos: upperEnd, ...noGen,
  })).result
  console.log('[02] upperLine:', upperLine)

  // Lower arm: external tangent from R50 (0,0) to R22 (148,-2) — lower side
  // sin(α) = (50-22)/148.013 = 0.18917, α = 10.91°
  // β = θ - π/2 + α
  const beta_lower = Math.atan2(-2, 148) - Math.PI / 2 + Math.asin(28 / Math.sqrt(148 ** 2 + 2 ** 2))
  const lowerStart = [50 * Math.cos(beta_lower), 50 * Math.sin(beta_lower), 0]
  const lowerEnd = [148 + 22 * Math.cos(beta_lower), -2 + 22 * Math.sin(beta_lower), 0]

  console.log('[02] lower tangent: (%.1f, %.1f) → (%.1f, %.1f)',
    lowerStart[0], lowerStart[1], lowerEnd[0], lowerEnd[1])

  const lowerLine = (await api.v1.sketch.line({
    id: skId, startPos: lowerStart, endPos: lowerEnd, ...noGen,
  })).result
  console.log('[02] lowerLine:', lowerLine)

  // ====== BASE OUTLINE ======

  // Body left wall: x = -28, from hub intersection to R25 tangent
  // R50 at x=-28: y = -sqrt(2500-784) = -41.43
  // R25 tangent to x=-28 at y=-32
  const leftWall = (await api.v1.sketch.line({
    id: skId, startPos: [-28, -41.43, 0], endPos: [-28, -32, 0], ...noGen,
  })).result
  console.log('[02] leftWall:', leftWall)

  // Base bottom: y = -57, from R25 tangent point to step
  // R25 tangent to y=-57 at x=-3
  const baseBottom = (await api.v1.sketch.line({
    id: skId, startPos: [-3, -57, 0], endPos: [39, -57, 0], ...noGen,
  })).result
  console.log('[02] baseBottom:', baseBottom)

  // Step rise: vertical from (39, -57) to (39, -35)
  const stepRise = (await api.v1.sketch.line({
    id: skId, startPos: [39, -57, 0], endPos: [39, -35, 0], ...noGen,
  })).result

  // Step top: horizontal from (39, -35) to (72, -35)
  const stepTop = (await api.v1.sketch.line({
    id: skId, startPos: [39, -35, 0], endPos: [72, -35, 0], ...noGen,
  })).result

  // Body right wall: from step top up to lower arm tangent crossing
  // Lower tangent at x=72: y = lowerStart[1] + (72-lowerStart[0])/(lowerEnd[0]-lowerStart[0]) * (lowerEnd[1]-lowerStart[1])
  const t72 = (72 - lowerStart[0]) / (lowerEnd[0] - lowerStart[0])
  const y72 = lowerStart[1] + t72 * (lowerEnd[1] - lowerStart[1])
  console.log('[02] lower tangent at x=72: y=%.2f', y72)

  const rightWall = (await api.v1.sketch.line({
    id: skId, startPos: [72, -35, 0], endPos: [72, y72, 0], ...noGen,
  })).result
  console.log('[02] stepRise=%d stepTop=%d rightWall=%d', stepRise, stepTop, rightWall)

  await snapshot('full-construction')

  // Filewrite key positions for verification
  filewrite({
    upperTangent: { start: upperStart.slice(0, 2), end: upperEnd.slice(0, 2) },
    lowerTangent: { start: lowerStart.slice(0, 2), end: lowerEnd.slice(0, 2) },
    lowerTangentAtX72: y72,
    baseBottom: -57,
    stepTop: -35,
    rightWallHeight: -35 - y72,
  }, 'positions')

  return { partId, skId }
}
