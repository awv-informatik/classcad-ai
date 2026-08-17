// Script 03: Complete construction geometry v2
// Added: extended body to x=108, body right wall, corrected step top extent
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Bracket' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const noGen = {
    genFixation: false, genIncidence: false,
    genVertAndHoriz: false, genTangency: false,
  }

  // ====== HELPER: tangent between two circles ======
  function externalTangent(c1, r1, c2, r2, side) {
    const dx = c2[0] - c1[0], dy = c2[1] - c1[1]
    const d = Math.sqrt(dx * dx + dy * dy)
    const theta = Math.atan2(dy, dx)
    const alpha = Math.asin((r1 - r2) / d)
    const beta = side === 'upper'
      ? theta + Math.PI / 2 - alpha
      : theta - Math.PI / 2 + alpha
    return {
      p1: [c1[0] + r1 * Math.cos(beta), c1[1] + r1 * Math.sin(beta)],
      p2: [c2[0] + r2 * Math.cos(beta), c2[1] + r2 * Math.sin(beta)],
    }
  }

  // ====== CIRCLES ======
  const ids = {}

  ids.hub = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 50, ...noGen })).result
  ids.outer = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 60, ...noGen })).result

  const boltPos = [[-25, 25], [25, 25], [-25, -25], [25, -25]]
  ids.bosses = []; ids.holes = []
  for (const [bx, by] of boltPos) {
    ids.bosses.push((await api.v1.sketch.circle({ id: skId, centerPos: [bx, by, 0], radius: 13, ...noGen })).result)
    ids.holes.push((await api.v1.sketch.circle({ id: skId, centerPos: [bx, by, 0], radius: 7, ...noGen })).result)
  }

  ids.rbOuter = (await api.v1.sketch.circle({ id: skId, centerPos: [148, -2, 0], radius: 22, ...noGen })).result
  ids.rbInner = (await api.v1.sketch.circle({ id: skId, centerPos: [148, -2, 0], radius: 9.5, ...noGen })).result
  ids.midHole = (await api.v1.sketch.circle({ id: skId, centerPos: [80, -20, 0], radius: 10, ...noGen })).result
  ids.r25 = (await api.v1.sketch.circle({ id: skId, centerPos: [-3, -32, 0], radius: 25, ...noGen })).result

  // ====== ARM TANGENT LINES ======
  const hubC = [0, 0], rbC = [148, -2]

  // Upper: R60 → R22
  const upper = externalTangent(hubC, 60, rbC, 22, 'upper')
  ids.upperArm = (await api.v1.sketch.line({
    id: skId, startPos: [...upper.p1, 0], endPos: [...upper.p2, 0], ...noGen,
  })).result

  // Lower: R50 → R22
  const lower = externalTangent(hubC, 50, rbC, 22, 'lower')
  ids.lowerArm = (await api.v1.sketch.line({
    id: skId, startPos: [...lower.p1, 0], endPos: [...lower.p2, 0], ...noGen,
  })).result

  console.log('[03] upper arm: (%.1f,%.1f)→(%.1f,%.1f)', ...upper.p1, ...upper.p2)
  console.log('[03] lower arm: (%.1f,%.1f)→(%.1f,%.1f)', ...lower.p1, ...lower.p2)

  // ====== BASE / BODY OUTLINE ======

  // Body left wall: x=-28, from R50 intersection down to R25 tangent
  // R50 at x=-28: y = -sqrt(2500-784) = -41.43
  // R25 tangent to x=-28: y = -32
  ids.leftWall = (await api.v1.sketch.line({
    id: skId, startPos: [-28, -41.43, 0], endPos: [-28, -32, 0], ...noGen,
  })).result

  // Base bottom: y=-57, from R25 tangent (x=-3) to step left (x=39)
  ids.baseBottom = (await api.v1.sketch.line({
    id: skId, startPos: [-3, -57, 0], endPos: [39, -57, 0], ...noGen,
  })).result

  // Step rise: (39,-57) → (39,-35)
  ids.stepRise = (await api.v1.sketch.line({
    id: skId, startPos: [39, -57, 0], endPos: [39, -35, 0], ...noGen,
  })).result

  // Step top + body bottom extended: (39,-35) → (108,-35)
  // 108 = 170 - 62 (body right edge from the 62 dimension)
  ids.bodyBottom = (await api.v1.sketch.line({
    id: skId, startPos: [39, -35, 0], endPos: [108, -35, 0], ...noGen,
  })).result

  // Body right wall at x=108: from y=-35 up to lower arm tangent
  const t108 = (108 - lower.p1[0]) / (lower.p2[0] - lower.p1[0])
  const y108 = lower.p1[1] + t108 * (lower.p2[1] - lower.p1[1])
  console.log('[03] lower arm at x=108: y=%.2f', y108)

  ids.rightWall = (await api.v1.sketch.line({
    id: skId, startPos: [108, -35, 0], endPos: [108, y108, 0], ...noGen,
  })).result

  console.log('[03] all IDs:', JSON.stringify(ids))

  await snapshot('full-v2')

  filewrite({
    upperTangent: upper,
    lowerTangent: lower,
    lowerAtX108: y108,
    bodyRightEdge: 108,
    stepProfile: { rise: [39, -57, 39, -35], top: [39, -35, 108, -35] },
  }, 'geometry-data')

  return { partId, skId }
}
