// Script 06: Profile v2 + key dimensions for verification
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Bracket' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const noGen = {
    genFixation: false, genIncidence: false,
    genVertAndHoriz: false, genTangency: false,
  }

  // ====== CONSTANTS ======
  const HUB = [0, 0], RB = [148, -2]
  const R60 = 60, R50 = 50, R22 = 22, R13 = 13, R7 = 7
  const R_RB_INNER = 9.5, R_MID = 10
  const BASE_BOTTOM = -57, STEP_TOP = -35, STEP_X = 39
  const BODY_RIGHT = 108, BASE_LEFT = -28
  const BOLTS = [[-25, 25], [25, 25], [-25, -25], [25, -25]]

  function tangent(c1, r1, c2, r2, side) {
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

  const r60BaseX = -Math.sqrt(R60 ** 2 - BASE_BOTTOM ** 2)
  const R60_BASE = [r60BaseX, BASE_BOTTOM]
  const upper = tangent(HUB, R60, RB, R22, 'upper')
  const lower = tangent(HUB, R50, RB, R22, 'lower')
  const tBR = (BODY_RIGHT - lower.p1[0]) / (lower.p2[0] - lower.p1[0])
  const yBR = lower.p1[1] + tBR * (lower.p2[1] - lower.p1[1])
  const r60LeftY = Math.sqrt(R60 ** 2 - BASE_LEFT ** 2)
  const R60_LEFT_UP = [BASE_LEFT, r60LeftY]

  // ====== OUTER PROFILE ======
  // 1. R60 arc: top — from R60_LEFT_UP CW to upper.p1
  await api.v1.sketch.arcByCenter({
    id: skId, startPos: [...R60_LEFT_UP, 0], centerPos: [0, 0, 0],
    endPos: [...upper.p1, 0], isClockwise: true, ...noGen,
  })
  // 2. Upper arm tangent
  await api.v1.sketch.line({ id: skId, startPos: [...upper.p1, 0], endPos: [...upper.p2, 0], ...noGen })
  // 3. R22 arc
  await api.v1.sketch.arcByCenter({
    id: skId, startPos: [...upper.p2, 0], centerPos: [...RB, 0],
    endPos: [...lower.p2, 0], isClockwise: true, ...noGen,
  })
  // 4. Lower arm tangent (to body right wall)
  await api.v1.sketch.line({ id: skId, startPos: [...lower.p2, 0], endPos: [BODY_RIGHT, yBR, 0], ...noGen })
  // 5. Body right wall
  await api.v1.sketch.line({ id: skId, startPos: [BODY_RIGHT, yBR, 0], endPos: [BODY_RIGHT, STEP_TOP, 0], ...noGen })
  // 6. Body bottom + step top
  await api.v1.sketch.line({ id: skId, startPos: [BODY_RIGHT, STEP_TOP, 0], endPos: [STEP_X, STEP_TOP, 0], ...noGen })
  // 7. Step down
  await api.v1.sketch.line({ id: skId, startPos: [STEP_X, STEP_TOP, 0], endPos: [STEP_X, BASE_BOTTOM, 0], ...noGen })
  // 8. Base bottom
  await api.v1.sketch.line({ id: skId, startPos: [STEP_X, BASE_BOTTOM, 0], endPos: [...R60_BASE, 0], ...noGen })
  // 9. R60 left/bottom arc: CCW from R60_BASE to R60_LEFT_UP
  await api.v1.sketch.arcByCenter({
    id: skId, startPos: [...R60_BASE, 0], centerPos: [0, 0, 0],
    endPos: [...R60_LEFT_UP, 0], isClockwise: false, ...noGen,
  })

  // ====== INTERNAL FEATURES ======
  const hubCircle = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: R50, ...noGen })).result
  const bossCircles = [], holeCircles = []
  for (const [bx, by] of BOLTS) {
    bossCircles.push((await api.v1.sketch.circle({ id: skId, centerPos: [bx, by, 0], radius: R13, ...noGen })).result)
    holeCircles.push((await api.v1.sketch.circle({ id: skId, centerPos: [bx, by, 0], radius: R7, ...noGen })).result)
  }
  const rbInner = (await api.v1.sketch.circle({ id: skId, centerPos: [...RB, 0], radius: R_RB_INNER, ...noGen })).result
  const midHole = (await api.v1.sketch.circle({ id: skId, centerPos: [80, -20, 0], radius: R_MID, ...noGen })).result

  // ====== DIMENSIONS ======
  // D1: Ø100 on hub bore
  const dimHub = (await api.v1.sketch.dimension({ id: skId, type: 'DIAMETER', geomIds: [hubCircle] })).result
  // D5: Ø44 on right boss outer — need the R22 arc, use rbInner's parent or the arc
  // Actually let me dimension rbInner for Ø19
  const dimRbInner = (await api.v1.sketch.dimension({ id: skId, type: 'DIAMETER', geomIds: [rbInner] })).result
  // D7: Ø20 on intermediate hole
  const dimMidHole = (await api.v1.sketch.dimension({ id: skId, type: 'DIAMETER', geomIds: [midHole] })).result

  // D3: Ø14 on a bolt hole
  const dimBoltHole = (await api.v1.sketch.dimension({ id: skId, type: 'DIAMETER', geomIds: [holeCircles[0]] })).result
  // D4: R13 — use RADIUS dim on a boss
  const dimBoss = (await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [bossCircles[0]] })).result

  // D8: 170 horizontal — hub center to right boss right edge
  // Need point IDs. Hub center = (0,0), right boss right edge = (170, -2)
  // Create temporary points for dimensioning? No — use circle center points.
  // Hub center: point at origin. Create a point for hub center.
  const originPt = (await api.v1.sketch.point({ id: skId, pos: [0, 0, 0], ...noGen })).result
  // Right boss center
  const rbCenterPt = (await api.v1.sketch.getPoints({ id: rbInner })).result.centerId

  const dimHoriz = (await api.v1.sketch.dimension({
    id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [originPt, rbCenterPt],
  })).result

  // D12: 38 — hub center to lower bolt boss bottom (vertical)
  const llBossCenterPt = (await api.v1.sketch.getPoints({ id: bossCircles[2] })).result.centerId
  const dimVert38 = (await api.v1.sketch.dimension({
    id: skId, type: 'VERTICAL_DISTANCE', geomIds: [originPt, llBossCenterPt],
  })).result

  console.log('[06] Dimensions: hub=%d rbInner=%d midHole=%d boltHole=%d boss=%d horiz=%d vert38=%d',
    dimHub, dimRbInner, dimMidHole, dimBoltHole, dimBoss, dimHoriz, dimVert38)

  await snapshot('dimensioned')

  return { partId, skId }
}
