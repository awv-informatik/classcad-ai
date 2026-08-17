// 03-bracket-final.mjs — Corrected: hub is Ø28 (not Ø38), add Ø26 middle ring

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BracketPlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // === CONSTANTS ===
  const hubR = 14       // Ø28/2 (corrected from Ø38)
  const midR = 13       // Ø26/2 (middle ring)
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
  const len = v => Math.sqrt(v[0]**2 + v[1]**2)
  const normalize = v => { const l = len(v); return [v[0]/l, v[1]/l] }
  const perp = v => [-v[1], v[0]]
  const dot = (a, b) => a[0]*b[0] + a[1]*b[1]
  const sub = (a, b) => [a[0]-b[0], a[1]-b[1]]
  const add = (a, b) => [a[0]+b[0], a[1]+b[1]]
  const scale = (v, s) => [v[0]*s, v[1]*s]

  function wallCircleIntersect(offsetPt, dir, center, r) {
    const v = sub(offsetPt, center)
    const b = 2 * dot(v, dir)
    const c = dot(v, v) - r * r
    const disc = b * b - 4 * c
    if (disc < 0) return null
    const sq = Math.sqrt(disc)
    return [(-b - sq) / 2, (-b + sq) / 2]
  }

  function outerTangent(A, B, r) {
    const d = normalize(sub(B, A))
    const p = perp(d)
    const mid = scale(add(A, B), 0.5)
    const outerP = (len(add(mid, p)) > len(sub(mid, p))) ? p : scale(p, -1)
    return [add(A, scale(outerP, r)), add(B, scale(outerP, r))]
  }

  // === CIRCLES ===
  // Hub: 3 concentric circles — Ø25, Ø26, Ø28
  const noGen = { genFixation: false, genIncidence: false }
  await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: hubR, ...noGen })
  await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: midR, ...noGen })
  await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: boreR, ...noGen })
  console.log('[03] Hub circles: Ø28, Ø26, Ø25')

  // Boss circles + holes
  for (const c of bossCenters) {
    await api.v1.sketch.circle({ id: skId, centerPos: [...c, 0], radius: bossR, ...noGen })
    await api.v1.sketch.circle({ id: skId, centerPos: [...c, 0], radius: holeR, ...noGen })
  }
  console.log('[03] 3 bosses (Ø17 + Ø6.6)')

  // === OUTER TANGENT LINES ===
  for (const [A, B] of [[BL, T], [T, BR], [BR, BL]]) {
    const [ptA, ptB] = outerTangent(A, B, bossR)
    await api.v1.sketch.line({
      id: skId, startPos: [...ptA, 0], endPos: [...ptB, 0],
      genFixation: false, genIncidence: false, genVertAndHoriz: false
    })
  }
  console.log('[03] 3 outer tangent lines')

  // === ARM WALLS ===
  for (const bc of bossCenters) {
    const d = normalize(bc)
    const p = perp(d)
    for (const side of [1, -1]) {
      const offsetPt = scale(p, side * armHW)
      const tHub = Math.sqrt(hubR * hubR - armHW * armHW)
      const hubPt = add(offsetPt, scale(d, tHub))
      const ts = wallCircleIntersect(offsetPt, d, bc, bossR)
      if (!ts) continue
      const bossPt = add(offsetPt, scale(d, ts[0]))
      await api.v1.sketch.line({
        id: skId, startPos: [...hubPt, 0], endPos: [...bossPt, 0],
        genFixation: false, genIncidence: false, genVertAndHoriz: false
      })
    }
  }
  console.log('[03] 6 arm wall lines')

  // === VERIFY KEY DIMS ===
  const toDeg = r => r * 180 / Math.PI
  const gapT = len(T) - hubR - bossR
  console.log(`[03] Hub→T gap: ${gapT.toFixed(2)} (arm length: ${(Math.sqrt(hubR**2-1) - len(T) + Math.sqrt(bossR**2-1)).toFixed(2)} approx)`)
  console.log(`[03] Angles: BL=${toDeg(Math.atan2(12,48)).toFixed(2)}°, T=${toDeg(Math.atan2(T[0],T[1])).toFixed(2)}°`)

  await snapshot('bracket-final')
  return { partId }
}
