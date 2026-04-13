// 01-bracket-plate.mjs — Full bracket plate sketch reproduction
// Draws: hub circles, boss circles, outer tangent triangle, arm walls, arcs

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BracketPlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // === CONSTANTS ===
  const hubR = 19       // Ø38/2
  const boreR = 12.5    // Ø25/2
  const bossR = 8.5     // Ø17/2
  const holeR = 3.3     // Ø6.6/2
  const armHW = 1       // arm half-width (width=2)

  // Boss centers (hub at origin)
  const BL = [-48, -12]
  const BR = [48, -12]
  const T  = [6.75, 29.23]
  const bossCenters = [BL, BR, T]

  // === HELPERS ===
  const dist = (a, b) => Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2)
  const len = v => Math.sqrt(v[0]**2 + v[1]**2)
  const normalize = v => { const l = len(v); return [v[0]/l, v[1]/l] }
  const perp = v => [-v[1], v[0]] // 90° CCW
  const dot = (a, b) => a[0]*b[0] + a[1]*b[1]
  const sub = (a, b) => [a[0]-b[0], a[1]-b[1]]
  const add = (a, b) => [a[0]+b[0], a[1]+b[1]]
  const scale = (v, s) => [v[0]*s, v[1]*s]

  // Line-circle intersection: wall defined by (offset_pt + t*dir), circle at center with radius r
  // Returns the two t values
  function wallCircleIntersect(offsetPt, dir, center, r) {
    const v = sub(offsetPt, center)
    const a = 1 // dir is unit
    const b = 2 * dot(v, dir)
    const c = dot(v, v) - r * r
    const disc = b * b - 4 * a * c
    if (disc < 0) return null
    const sq = Math.sqrt(disc)
    return [(-b - sq) / 2, (-b + sq) / 2]
  }

  // External tangent points between two equal-radius circles
  // Returns [tangentPtOnA, tangentPtOnB] on the outer side (away from hub)
  function outerTangent(A, B, r) {
    const c2c = sub(B, A)
    const d = normalize(c2c)
    const p = perp(d)
    // Determine which side is outer (away from origin)
    const mid = scale(add(A, B), 0.5)
    const testA = add(mid, p)
    const testB = sub(mid, p)
    const outerP = (len(testA) > len(testB)) ? p : scale(p, -1)
    return [
      add(A, scale(outerP, r)),
      add(B, scale(outerP, r))
    ]
  }

  // === DRAW CIRCLES ===
  console.log('[01] Creating circles...')

  // Hub: Ø38 outer, Ø25 bore
  const hubCircle = (await api.v1.sketch.circle({
    id: skId, centerPos: [0, 0, 0], radius: hubR,
    genFixation: false, genIncidence: false
  })).result
  const boreCircle = (await api.v1.sketch.circle({
    id: skId, centerPos: [0, 0, 0], radius: boreR,
    genFixation: false, genIncidence: false
  })).result
  console.log('[01] hub:', hubCircle, 'bore:', boreCircle)

  // Boss circles + through-holes
  const bossIds = []
  const holeIds = []
  for (const c of bossCenters) {
    const boss = (await api.v1.sketch.circle({
      id: skId, centerPos: [...c, 0], radius: bossR,
      genFixation: false, genIncidence: false
    })).result
    const hole = (await api.v1.sketch.circle({
      id: skId, centerPos: [...c, 0], radius: holeR,
      genFixation: false, genIncidence: false
    })).result
    bossIds.push(boss)
    holeIds.push(hole)
    console.log(`[01] boss at (${c}): outer=${boss}, hole=${hole}`)
  }

  // === OUTER TRIANGLE (external tangent lines between equal-radius boss circles) ===
  console.log('[01] Creating outer tangent lines...')
  const tangentPairs = [
    [BL, T],   // left edge
    [T, BR],   // right edge
    [BR, BL],  // bottom edge
  ]
  const tangentLines = []
  for (const [A, B] of tangentPairs) {
    const [ptA, ptB] = outerTangent(A, B, bossR)
    const lineId = (await api.v1.sketch.line({
      id: skId, startPos: [...ptA, 0], endPos: [...ptB, 0],
      genFixation: false, genIncidence: false, genVertAndHoriz: false
    })).result
    tangentLines.push(lineId)
    console.log(`[01] tangent (${A})→(${B}): line=${lineId}, from (${ptA.map(v=>v.toFixed(2))}) to (${ptB.map(v=>v.toFixed(2))})`)
  }

  // === ARM WALLS ===
  console.log('[01] Creating arm wall lines...')
  const armLines = []
  for (const bossCenter of bossCenters) {
    const d = normalize(bossCenter) // direction from hub to boss
    const p = perp(d)
    const hubDist = len(bossCenter)

    for (const side of [1, -1]) {
      const offsetPt = scale(p, side * armHW)

      // Intersection with hub circle (r=hubR)
      const tHub = Math.sqrt(hubR * hubR - armHW * armHW)
      const hubPt = add(offsetPt, scale(d, tHub))

      // Intersection with boss circle (r=bossR at bossCenter)
      const ts = wallCircleIntersect(offsetPt, d, bossCenter, bossR)
      if (!ts) { console.log(`[01] WARN: no intersection for boss at ${bossCenter}`); continue }
      const tBoss = ts[0] // entry point (smaller t)
      const bossPt = add(offsetPt, scale(d, tBoss))

      const lineId = (await api.v1.sketch.line({
        id: skId, startPos: [...hubPt, 0], endPos: [...bossPt, 0],
        genFixation: false, genIncidence: false, genVertAndHoriz: false
      })).result
      armLines.push(lineId)
      console.log(`[01] arm wall to (${bossCenter}), side=${side}: line=${lineId}, hub=(${hubPt.map(v=>v.toFixed(2))}), boss=(${bossPt.map(v=>v.toFixed(2))})`)
    }
  }

  // === SNAPSHOT ===
  await snapshot('bracket-v1')

  // === DUMP DATA ===
  filewrite({
    bossCenters: { BL, BR, T },
    hubR, boreR, bossR, holeR, armHW,
    tangentLines,
    armLines,
    bossIds,
    holeIds,
    hubCircle,
    boreCircle,
  }, 'geometry-data')

  console.log(`[01] Done. ${tangentLines.length} tangent lines, ${armLines.length} arm lines`)
  return { partId }
}
