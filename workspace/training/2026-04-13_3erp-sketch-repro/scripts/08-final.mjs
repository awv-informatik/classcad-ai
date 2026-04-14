// 07-final.mjs — Complete bracket plate: geometry + construction lines + constraints + dimensions

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
  const hubOuter = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: hubR, ...noGen })).result
  const hubMid   = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: midR, ...noGen })).result
  const hubBore  = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: boreR, ...noGen })).result

  // Boss circles + holes
  const bossIds = [], holeIds = []
  for (const c of bossCenters) {
    bossIds.push((await api.v1.sketch.circle({ id: skId, centerPos: [...c, 0], radius: bossR, ...noGen })).result)
    holeIds.push((await api.v1.sketch.circle({ id: skId, centerPos: [...c, 0], radius: holeR, ...noGen })).result)
  }

  // Outer tangent lines
  const tangentLineIds = []
  for (const [A, B] of [[BL, T], [T, BR], [BR, BL]]) {
    const [ptA, ptB] = outerTangent(A, B, bossR)
    tangentLineIds.push((await api.v1.sketch.line({ id: skId, startPos: [...ptA, 0], endPos: [...ptB, 0], ...noGen })).result)
  }

  // Arm walls (6 lines, 2 per arm)
  const armWallIds = []
  for (const bc of bossCenters) {
    const d = normalize(bc), p = perpV(d)
    for (const side of [1, -1]) {
      const offsetPt = scale(p, side * armHW)
      const tHub = Math.sqrt(hubR ** 2 - armHW ** 2)
      const hubPt = add(offsetPt, scale(d, tHub))
      const ts = wallCircleIntersect(offsetPt, d, bc, bossR)
      if (!ts) continue
      const bossPt = add(offsetPt, scale(d, ts[0]))
      armWallIds.push((await api.v1.sketch.line({ id: skId, startPos: [...hubPt, 0], endPos: [...bossPt, 0], ...noGen })).result)
    }
  }

  // Construction lines: hub → each boss center
  const armCenterLines = []
  for (const bc of bossCenters) {
    armCenterLines.push((await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [...bc, 0], ...noGen })).result)
  }

  // Horizontal + vertical reference lines through hub
  const hRefLine = (await api.v1.sketch.line({ id: skId, startPos: [-55, 0, 0], endPos: [55, 0, 0], ...noGen })).result
  const vRefLine = (await api.v1.sketch.line({ id: skId, startPos: [0, -25, 0], endPos: [0, 35, 0], ...noGen })).result

  console.log('[07] Geometry done')

  // ============================================================
  // CONSTRAINTS
  // ============================================================

  // Concentric: hub circles (2)
  await api.v1.sketch.constraint([
    { id: skId, type: 'CONCENTRIC', geomIds: [hubOuter, hubMid] },
    { id: skId, type: 'CONCENTRIC', geomIds: [hubOuter, hubBore] },
  ])

  // Concentric: boss + hole pairs (3)
  for (let i = 0; i < 3; i++) {
    await api.v1.sketch.constraint({ id: skId, type: 'CONCENTRIC', geomIds: [bossIds[i], holeIds[i]] })
  }

  // Tangent: tangent lines to boss circles (6)
  for (const [li, ci] of [[0, 0], [0, 2], [1, 2], [1, 1], [2, 1], [2, 0]]) {
    await api.v1.sketch.constraint({ id: skId, type: 'TANGENT', geomIds: [tangentLineIds[li], bossIds[ci]] })
  }

  // Horizontal: bottom tangent line + reference (2)
  // Vertical: reference (1)
  await api.v1.sketch.constraint([
    { id: skId, type: 'HORIZONTAL', geomIds: [tangentLineIds[2]] },
    { id: skId, type: 'HORIZONTAL', geomIds: [hRefLine] },
    { id: skId, type: 'VERTICAL', geomIds: [vRefLine] },
  ])

  console.log('[07] Constraints done (14 total)')

  // ============================================================
  // DIMENSIONS
  // ============================================================

  // Get center point IDs
  const hubCenterId = (await api.v1.sketch.getPoints({ id: hubOuter })).result.centerId
  const bossCenterPtIds = []
  for (const bId of bossIds) {
    bossCenterPtIds.push((await api.v1.sketch.getPoints({ id: bId })).result.centerId)
  }
  const bottomStartId = (await api.v1.sketch.getPoints({ id: tangentLineIds[2] })).result.startId

  // Diameters (5)
  await api.v1.sketch.dimension([
    { id: skId, type: 'DIAMETER', geomIds: [hubOuter], name: 'D_hub' },
    { id: skId, type: 'DIAMETER', geomIds: [hubMid], name: 'D_mid' },
    { id: skId, type: 'DIAMETER', geomIds: [hubBore], name: 'D_bore' },
    { id: skId, type: 'DIAMETER', geomIds: [bossIds[2]], name: 'D_boss' },
    { id: skId, type: 'DIAMETER', geomIds: [holeIds[2]], name: 'D_hole' },
  ])

  // Horizontal distances (3)
  await api.v1.sketch.dimension([
    { id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [hubCenterId, bossCenterPtIds[0]], name: '48L' },
    { id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [hubCenterId, bossCenterPtIds[1]], name: '48R' },
    { id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [hubCenterId, bossCenterPtIds[2]], name: '6.75' },
  ])

  // Vertical distances (2)
  await api.v1.sketch.dimension([
    { id: skId, type: 'VERTICAL_DISTANCE', geomIds: [bottomStartId, hubCenterId], name: '20.5' },
    { id: skId, type: 'VERTICAL_DISTANCE', geomIds: [bottomStartId, bossCenterPtIds[2]], name: '49.73' },
  ])

  // Angles (3)
  await api.v1.sketch.dimension([
    { id: skId, type: 'ANGLE', geomIds: [hRefLine, armCenterLines[0]], name: '14L', dimPos: [-20, -8, 0] },
    { id: skId, type: 'ANGLE', geomIds: [hRefLine, armCenterLines[1]], name: '14R', dimPos: [20, -8, 0] },
    { id: skId, type: 'ANGLE', geomIds: [vRefLine, armCenterLines[2]], name: '13', dimPos: [4, 20, 0] },
  ])

  // Arm widths (3)
  await api.v1.sketch.dimension([
    { id: skId, type: 'OFFSET', geomIds: [armWallIds[0], armWallIds[1]], name: 'w_BL' },
    { id: skId, type: 'OFFSET', geomIds: [armWallIds[2], armWallIds[3]], name: 'w_BR' },
    { id: skId, type: 'OFFSET', geomIds: [armWallIds[4], armWallIds[5]], name: 'w_T' },
  ])

  console.log('[07] Dimensions done (16 total)')

  await snapshot('final')

  console.log('[07] COMPLETE — 18 geometry + 5 construction lines + 14 constraints + 16 dimensions')
  return { partId }
}
