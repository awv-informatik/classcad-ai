// 05-bracket-complete.mjs — Full sketch with geometry + constraints + dimensions

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BracketPlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // === CONSTANTS ===
  const hubR = 19, midR = 13, boreR = 12.5, bossR = 8.5, holeR = 3.3, armHW = 1
  const BL = [-48, -12], BR = [48, -12], T = [6.75, 29.23]
  const bossCenters = [BL, BR, T]

  // === HELPERS ===
  const len = v => Math.sqrt(v[0]**2 + v[1]**2)
  const normalize = v => { const l = len(v); return [v[0]/l, v[1]/l] }
  const perpV = v => [-v[1], v[0]]
  const dot = (a, b) => a[0]*b[0] + a[1]*b[1]
  const sub = (a, b) => [a[0]-b[0], a[1]-b[1]]
  const add = (a, b) => [a[0]+b[0], a[1]+b[1]]
  const scale = (v, s) => [v[0]*s, v[1]*s]

  function wallCircleIntersect(offsetPt, dir, center, r) {
    const v = sub(offsetPt, center)
    const b = 2 * dot(v, dir), c = dot(v, v) - r * r
    const disc = b * b - 4 * c
    if (disc < 0) return null
    const sq = Math.sqrt(disc)
    return [(-b - sq) / 2, (-b + sq) / 2]
  }

  function outerTangent(A, B, r) {
    const d = normalize(sub(B, A)), p = perpV(d)
    const mid = scale(add(A, B), 0.5)
    const outerP = (len(add(mid, p)) > len(sub(mid, p))) ? p : scale(p, -1)
    return [add(A, scale(outerP, r)), add(B, scale(outerP, r))]
  }

  const noGen = { genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false }

  // ============================================================
  // GEOMETRY
  // ============================================================

  // Hub: 3 concentric circles Ø38, Ø26, Ø25
  const hubOuter = (await api.v1.sketch.circle({ id: skId, centerPos: [0,0,0], radius: hubR, ...noGen })).result
  const hubMid   = (await api.v1.sketch.circle({ id: skId, centerPos: [0,0,0], radius: midR, ...noGen })).result
  const hubBore  = (await api.v1.sketch.circle({ id: skId, centerPos: [0,0,0], radius: boreR, ...noGen })).result
  console.log('[05] Hub circles:', hubOuter, hubMid, hubBore)

  // Boss circles + holes
  const bossIds = [], holeIds = []
  for (const c of bossCenters) {
    const boss = (await api.v1.sketch.circle({ id: skId, centerPos: [...c,0], radius: bossR, ...noGen })).result
    const hole = (await api.v1.sketch.circle({ id: skId, centerPos: [...c,0], radius: holeR, ...noGen })).result
    bossIds.push(boss); holeIds.push(hole)
  }
  console.log('[05] Bosses:', bossIds, 'Holes:', holeIds)

  // Outer tangent lines
  const tangentPairs = [[BL,T],[T,BR],[BR,BL]]
  const tangentLineIds = []
  for (const [A, B] of tangentPairs) {
    const [ptA, ptB] = outerTangent(A, B, bossR)
    const id = (await api.v1.sketch.line({
      id: skId, startPos: [...ptA,0], endPos: [...ptB,0], ...noGen
    })).result
    tangentLineIds.push(id)
  }
  console.log('[05] Tangent lines:', tangentLineIds)

  // Arm walls
  const armWallIds = [] // [BL_left, BL_right, BR_left, BR_right, T_left, T_right]
  for (const bc of bossCenters) {
    const d = normalize(bc), p = perpV(d)
    for (const side of [1, -1]) {
      const offsetPt = scale(p, side * armHW)
      const tHub = Math.sqrt(hubR**2 - armHW**2)
      const hubPt = add(offsetPt, scale(d, tHub))
      const ts = wallCircleIntersect(offsetPt, d, bc, bossR)
      if (!ts) continue
      const bossPt = add(offsetPt, scale(d, ts[0]))
      const id = (await api.v1.sketch.line({
        id: skId, startPos: [...hubPt,0], endPos: [...bossPt,0], ...noGen
      })).result
      armWallIds.push(id)
    }
  }
  console.log('[05] Arm walls:', armWallIds)

  // Construction lines: hub to each boss (for angle dimensions)
  const armCenterLines = []
  for (const bc of bossCenters) {
    const id = (await api.v1.sketch.line({
      id: skId, startPos: [0,0,0], endPos: [...bc,0], ...noGen
    })).result
    armCenterLines.push(id)
  }
  console.log('[05] Arm centerlines:', armCenterLines)

  // Horizontal + vertical reference lines through hub (short construction lines)
  const hRefLine = (await api.v1.sketch.line({
    id: skId, startPos: [-55,0,0], endPos: [55,0,0], ...noGen
  })).result
  const vRefLine = (await api.v1.sketch.line({
    id: skId, startPos: [0,-25,0], endPos: [0,35,0], ...noGen
  })).result
  console.log('[05] Ref lines: H=', hRefLine, 'V=', vRefLine)

  // ============================================================
  // CONSTRAINTS
  // ============================================================
  console.log('[05] Adding constraints...')

  // Concentric: hub circles
  await api.v1.sketch.constraint([
    { id: skId, type: 'CONCENTRIC', geomIds: [hubOuter, hubMid] },
    { id: skId, type: 'CONCENTRIC', geomIds: [hubOuter, hubBore] },
  ])

  // Concentric: boss + hole pairs
  for (let i = 0; i < 3; i++) {
    await api.v1.sketch.constraint({
      id: skId, type: 'CONCENTRIC', geomIds: [bossIds[i], holeIds[i]]
    })
  }

  // Tangent: tangent lines to boss circles
  // tangentPairs: [BL,T], [T,BR], [BR,BL]
  // Each tangent line touches 2 boss circles
  const tangentBossPairs = [
    [tangentLineIds[0], bossIds[0]], // left edge → BL boss
    [tangentLineIds[0], bossIds[2]], // left edge → T boss
    [tangentLineIds[1], bossIds[2]], // right edge → T boss
    [tangentLineIds[1], bossIds[1]], // right edge → BR boss
    [tangentLineIds[2], bossIds[1]], // bottom edge → BR boss
    [tangentLineIds[2], bossIds[0]], // bottom edge → BL boss
  ]
  for (const [lineId, circleId] of tangentBossPairs) {
    const r = await api.v1.sketch.constraint({
      id: skId, type: 'TANGENT', geomIds: [lineId, circleId]
    })
    if (r.maxLevel > 31) console.log('[05] TANGENT warning:', r.messages)
  }

  // Horizontal: bottom tangent line
  await api.v1.sketch.constraint({
    id: skId, type: 'HORIZONTAL', geomIds: [tangentLineIds[2]]
  })

  // Horizontal + Vertical on reference lines
  await api.v1.sketch.constraint([
    { id: skId, type: 'HORIZONTAL', geomIds: [hRefLine] },
    { id: skId, type: 'VERTICAL', geomIds: [vRefLine] },
  ])

  console.log('[05] Constraints done')

  // ============================================================
  // DIMENSIONS
  // ============================================================
  console.log('[05] Adding dimensions...')

  // Get center point IDs for distance dimensions
  const hubCenterId = (await api.v1.sketch.getPoints({ id: hubOuter })).result.centerId
  const bossCenterPtIds = []
  for (const bId of bossIds) {
    const pts = (await api.v1.sketch.getPoints({ id: bId })).result
    bossCenterPtIds.push(pts.centerId)
  }

  // Diameters
  const dimHub = (await api.v1.sketch.dimension({ id: skId, type: 'DIAMETER', geomIds: [hubOuter], name: 'D_hub' })).result
  const dimMid = (await api.v1.sketch.dimension({ id: skId, type: 'DIAMETER', geomIds: [hubMid], name: 'D_mid' })).result
  const dimBore = (await api.v1.sketch.dimension({ id: skId, type: 'DIAMETER', geomIds: [hubBore], name: 'D_bore' })).result
  const dimBoss = (await api.v1.sketch.dimension({ id: skId, type: 'DIAMETER', geomIds: [bossIds[2]], name: 'D_boss' })).result  // top boss (annotated as 3x)
  const dimHole = (await api.v1.sketch.dimension({ id: skId, type: 'DIAMETER', geomIds: [holeIds[2]], name: 'D_hole' })).result  // top hole
  console.log('[05] Diameter dims:', { dimHub, dimMid, dimBore, dimBoss, dimHole })

  // Horizontal distances (48 left, 48 right, 6.75 top offset)
  const dim48L = (await api.v1.sketch.dimension({
    id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [hubCenterId, bossCenterPtIds[0]], name: 'dist_48L'
  })).result
  const dim48R = (await api.v1.sketch.dimension({
    id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [hubCenterId, bossCenterPtIds[1]], name: 'dist_48R'
  })).result
  const dim675 = (await api.v1.sketch.dimension({
    id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [hubCenterId, bossCenterPtIds[2]], name: 'dist_6.75'
  })).result
  console.log('[05] H-distance dims:', { dim48L, dim48R, dim675 })

  // Vertical distances (20.5 and 49.73)
  // Need bottom tangent line endpoints for bottom datum
  const bottomLinePts = await api.v1.sketch.getPoints({ id: tangentLineIds[2] })
  const bottomStartId = bottomLinePts.result.startId  // a point on the bottom tangent

  const dim205 = (await api.v1.sketch.dimension({
    id: skId, type: 'VERTICAL_DISTANCE', geomIds: [bottomStartId, hubCenterId], name: 'dist_20.5'
  })).result
  const dim4973 = (await api.v1.sketch.dimension({
    id: skId, type: 'VERTICAL_DISTANCE', geomIds: [bottomStartId, bossCenterPtIds[2]], name: 'dist_49.73'
  })).result
  console.log('[05] V-distance dims:', { dim205, dim4973 })

  // Angles (14° left, 14° right, 13° top)
  // ANGLE between arm centerlines and reference lines
  // 14° BL: angle between horizontal ref and BL arm centerline
  const dimAngleBL = (await api.v1.sketch.dimension({
    id: skId, type: 'ANGLE', geomIds: [hRefLine, armCenterLines[0]], name: 'angle_14L',
    dimPos: [-20, -8, 0]  // position in the acute angle sector
  })).result
  // 14° BR: angle between horizontal ref and BR arm centerline
  const dimAngleBR = (await api.v1.sketch.dimension({
    id: skId, type: 'ANGLE', geomIds: [hRefLine, armCenterLines[1]], name: 'angle_14R',
    dimPos: [20, -8, 0]
  })).result
  // 13° T: angle between vertical ref and T arm centerline
  const dimAngleT = (await api.v1.sketch.dimension({
    id: skId, type: 'ANGLE', geomIds: [vRefLine, armCenterLines[2]], name: 'angle_13',
    dimPos: [4, 20, 0]
  })).result
  console.log('[05] Angle dims:', { dimAngleBL, dimAngleBR, dimAngleT })

  // Arm width: OFFSET between parallel arm wall pairs
  // Each arm has 2 walls — measure offset between them
  const dimArmBL = (await api.v1.sketch.dimension({
    id: skId, type: 'OFFSET', geomIds: [armWallIds[0], armWallIds[1]], name: 'arm_w_BL'
  })).result
  const dimArmBR = (await api.v1.sketch.dimension({
    id: skId, type: 'OFFSET', geomIds: [armWallIds[2], armWallIds[3]], name: 'arm_w_BR'
  })).result
  const dimArmT = (await api.v1.sketch.dimension({
    id: skId, type: 'OFFSET', geomIds: [armWallIds[4], armWallIds[5]], name: 'arm_w_T'
  })).result
  console.log('[05] Arm width dims:', { dimArmBL, dimArmBR, dimArmT })

  console.log('[05] All dimensions added')

  await snapshot('bracket-complete')

  filewrite({
    geometry: { hubOuter, hubMid, hubBore, bossIds, holeIds, tangentLineIds, armWallIds, armCenterLines, hRefLine, vRefLine },
    dimensions: { dimHub, dimMid, dimBore, dimBoss, dimHole, dim48L, dim48R, dim675, dim205, dim4973, dimAngleBL, dimAngleBR, dimAngleT, dimArmBL, dimArmBR, dimArmT },
  }, 'complete-ids')

  return { partId }
}
