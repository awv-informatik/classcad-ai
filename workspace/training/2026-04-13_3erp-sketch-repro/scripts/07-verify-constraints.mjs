// 07-verify-constraints.mjs — Same as 05 but dump structure tree to prove constraints exist

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BracketPlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const hubR = 19, midR = 13, boreR = 12.5, bossR = 8.5, holeR = 3.3, armHW = 1
  const BL = [-48, -12], BR = [48, -12], T = [6.75, 29.23]
  const bossCenters = [BL, BR, T]

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

  // === GEOMETRY (same as 05) ===
  const hubOuter = (await api.v1.sketch.circle({ id: skId, centerPos: [0,0,0], radius: hubR, ...noGen })).result
  const hubMid   = (await api.v1.sketch.circle({ id: skId, centerPos: [0,0,0], radius: midR, ...noGen })).result
  const hubBore  = (await api.v1.sketch.circle({ id: skId, centerPos: [0,0,0], radius: boreR, ...noGen })).result

  const bossIds = [], holeIds = []
  for (const c of bossCenters) {
    bossIds.push((await api.v1.sketch.circle({ id: skId, centerPos: [...c,0], radius: bossR, ...noGen })).result)
    holeIds.push((await api.v1.sketch.circle({ id: skId, centerPos: [...c,0], radius: holeR, ...noGen })).result)
  }

  const tangentLineIds = []
  for (const [A, B] of [[BL,T],[T,BR],[BR,BL]]) {
    const [ptA, ptB] = outerTangent(A, B, bossR)
    tangentLineIds.push((await api.v1.sketch.line({ id: skId, startPos: [...ptA,0], endPos: [...ptB,0], ...noGen })).result)
  }

  const armWallIds = []
  for (const bc of bossCenters) {
    const d = normalize(bc), p = perpV(d)
    for (const side of [1, -1]) {
      const offsetPt = scale(p, side * armHW)
      const tHub = Math.sqrt(hubR**2 - armHW**2)
      const hubPt = add(offsetPt, scale(d, tHub))
      const ts = wallCircleIntersect(offsetPt, d, bc, bossR)
      if (!ts) continue
      const bossPt = add(offsetPt, scale(d, ts[0]))
      armWallIds.push((await api.v1.sketch.line({ id: skId, startPos: [...hubPt,0], endPos: [...bossPt,0], ...noGen })).result)
    }
  }

  const armCenterLines = []
  for (const bc of bossCenters) {
    armCenterLines.push((await api.v1.sketch.line({ id: skId, startPos: [0,0,0], endPos: [...bc,0], ...noGen })).result)
  }

  const hRefLine = (await api.v1.sketch.line({ id: skId, startPos: [-55,0,0], endPos: [55,0,0], ...noGen })).result
  const vRefLine = (await api.v1.sketch.line({ id: skId, startPos: [0,-25,0], endPos: [0,35,0], ...noGen })).result

  // === CONSTRAINTS (same as 05) — capture ALL return values ===
  const constraintResults = []

  // Concentric: hub circles
  const r1 = await api.v1.sketch.constraint([
    { id: skId, type: 'CONCENTRIC', geomIds: [hubOuter, hubMid] },
    { id: skId, type: 'CONCENTRIC', geomIds: [hubOuter, hubBore] },
  ])
  constraintResults.push({ type: 'CONCENTRIC hub', ids: r1.result, maxLevel: r1.maxLevel })

  // Concentric: boss + hole pairs
  for (let i = 0; i < 3; i++) {
    const r = await api.v1.sketch.constraint({
      id: skId, type: 'CONCENTRIC', geomIds: [bossIds[i], holeIds[i]]
    })
    constraintResults.push({ type: `CONCENTRIC boss${i}`, id: r.result, maxLevel: r.maxLevel })
  }

  // Tangent: tangent lines to boss circles
  const tangentBossPairs = [
    [tangentLineIds[0], bossIds[0]], [tangentLineIds[0], bossIds[2]],
    [tangentLineIds[1], bossIds[2]], [tangentLineIds[1], bossIds[1]],
    [tangentLineIds[2], bossIds[1]], [tangentLineIds[2], bossIds[0]],
  ]
  for (const [lineId, circleId] of tangentBossPairs) {
    const r = await api.v1.sketch.constraint({
      id: skId, type: 'TANGENT', geomIds: [lineId, circleId]
    })
    constraintResults.push({ type: 'TANGENT', geomIds: [lineId, circleId], id: r.result, maxLevel: r.maxLevel })
  }

  // Horizontal + Vertical
  const r2 = await api.v1.sketch.constraint([
    { id: skId, type: 'HORIZONTAL', geomIds: [tangentLineIds[2]] },
    { id: skId, type: 'HORIZONTAL', geomIds: [hRefLine] },
    { id: skId, type: 'VERTICAL', geomIds: [vRefLine] },
  ])
  constraintResults.push({ type: 'H+V', ids: r2.result, maxLevel: r2.maxLevel })

  // Log all constraint results
  for (const cr of constraintResults) {
    console.log(`[07] Constraint ${cr.type}: id=${cr.id || JSON.stringify(cr.ids)}, maxLevel=${cr.maxLevel}`)
  }

  // === DUMP STRUCTURE to prove constraints exist ===
  // Get the last API response which includes the structure tree
  const dummyR = await api.v1.sketch.getGeometry({ id: skId })

  // Find all constraint nodes in the structure
  function findConstraints(nodes, results = []) {
    if (!nodes) return results
    for (const node of (Array.isArray(nodes) ? nodes : [nodes])) {
      if (node.class && node.class.includes('Constraint')) {
        results.push({ id: node.id, class: node.class, name: node.name })
      }
      if (node.children) findConstraints(node.children, results)
    }
    return results
  }

  // Write the full structure for analysis
  filewrite(dummyR.structure, 'structure-tree')
  filewrite(constraintResults, 'constraint-results')

  // Count constraints in the structure
  const constraints = findConstraints(dummyR.structure)
  console.log(`[07] Found ${constraints.length} constraints in structure tree:`)
  for (const c of constraints) {
    console.log(`  ${c.class}: "${c.name}" (id=${c.id})`)
  }

  await snapshot('bracket-with-constraints')
  return { partId }
}
