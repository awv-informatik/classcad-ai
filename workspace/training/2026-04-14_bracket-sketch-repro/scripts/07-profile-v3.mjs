// Script 07: Profile v3 — R60 top, R50 left side, R25 corner, step
// Fixes: adds R50→R60 transition, R25 corner at bottom-left
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Bracket' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const noGen = {
    genFixation: false, genIncidence: false,
    genVertAndHoriz: false, genTangency: false,
  }

  // ====== CONSTANTS ======
  const HUB = [0, 0], RB = [148, -2]
  const R_60 = 60, R_50 = 50, R_22 = 22, R_13 = 13, R_7 = 7
  const R_RB_INNER = 9.5, R_MID = 10, R_25 = 25
  const BASE_BOTTOM = -57, STEP_TOP = -35, STEP_X = 39
  const BODY_RIGHT = 108
  const BOLTS = [[-25, 25], [25, 25], [-25, -25], [25, -25]]
  const R25C = [-3, -32] // R25 center: tangent to x=-28 and y=-57

  // ====== HELPERS ======
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

  // ====== KEY GEOMETRY POINTS ======
  const upper = tangent(HUB, R_60, RB, R_22, 'upper')
  const lower = tangent(HUB, R_50, RB, R_22, 'lower')
  const tBR = (BODY_RIGHT - lower.p1[0]) / (lower.p2[0] - lower.p1[0])
  const yBR = lower.p1[1] + tBR * (lower.p2[1] - lower.p1[1])

  // R60→R50 transition at 135° (upper-left, near UL bolt position)
  const TRANS_ANGLE = 135 * Math.PI / 180
  const R60_135 = [R_60 * Math.cos(TRANS_ANGLE), R_60 * Math.sin(TRANS_ANGLE)]
  const R50_135 = [R_50 * Math.cos(TRANS_ANGLE), R_50 * Math.sin(TRANS_ANGLE)]

  // R50-R25 intersection (where hub contour meets corner arc)
  // R50: x²+y²=2500, R25: (x+3)²+(y+32)²=625
  const cx = R25C[0], cy = R25C[1]
  const K = (R_50 ** 2 - R_25 ** 2 + cx ** 2 + cy ** 2) / 2
  const A = (cy / cx) ** 2 + 1
  const B = -2 * K * cy / (cx ** 2)
  const C = (K / cx) ** 2 - R_50 ** 2
  const disc = B * B - 4 * A * C
  const y1 = (-B - Math.sqrt(disc)) / (2 * A)
  const x1 = (K - cy * y1) / cx
  const y2 = (-B + Math.sqrt(disc)) / (2 * A)
  const x2 = (K - cy * y2) / cx
  // Pick the LOWER-LEFT intersection (more negative x)
  const R50_R25 = x1 < x2 ? [x1, y1] : [x2, y2]
  // R25 tangent to base bottom (y=-57): at (R25C[0], -57) = (-3, -57)
  const R25_BASE = [R25C[0], BASE_BOTTOM]

  console.log('[07] R60@135°: (%.1f, %.1f)', ...R60_135)
  console.log('[07] R50@135°: (%.1f, %.1f)', ...R50_135)
  console.log('[07] R50-R25 intersection: (%.1f, %.1f)', ...R50_R25)
  console.log('[07] upper tangent: (%.1f,%.1f)→(%.1f,%.1f)', ...upper.p1, ...upper.p2)
  console.log('[07] lower tangent: (%.1f,%.1f)→(%.1f,%.1f)', ...lower.p1, ...lower.p2)
  console.log('[07] body right wall at x=%d: y=%.1f', BODY_RIGHT, yBR)

  // ====== OUTER PROFILE (clockwise from top-left) ======

  // 1. R60 arc: from R60@135° CW to upper.p1 (over the top)
  const a1 = await api.v1.sketch.arcByCenter({
    id: skId, startPos: [...R60_135, 0], centerPos: [0, 0, 0],
    endPos: [...upper.p1, 0], isClockwise: true, ...noGen,
  })
  console.log('[07] 1. R60 top arc:', a1.maxLevel <= 31 ? '✓' : '❌')

  // 2. Upper arm tangent
  await api.v1.sketch.line({ id: skId, startPos: [...upper.p1, 0], endPos: [...upper.p2, 0], ...noGen })

  // 3. R22 arc (right boss outer, CW from upper to lower tangent)
  const a3 = await api.v1.sketch.arcByCenter({
    id: skId, startPos: [...upper.p2, 0], centerPos: [...RB, 0],
    endPos: [...lower.p2, 0], isClockwise: true, ...noGen,
  })
  console.log('[07] 3. R22 arc:', a3.maxLevel <= 31 ? '✓' : '❌')

  // 4. Lower arm tangent to body right wall
  await api.v1.sketch.line({ id: skId, startPos: [...lower.p2, 0], endPos: [BODY_RIGHT, yBR, 0], ...noGen })

  // 5. Body right wall
  await api.v1.sketch.line({ id: skId, startPos: [BODY_RIGHT, yBR, 0], endPos: [BODY_RIGHT, STEP_TOP, 0], ...noGen })

  // 6. Body bottom (step top level)
  await api.v1.sketch.line({ id: skId, startPos: [BODY_RIGHT, STEP_TOP, 0], endPos: [STEP_X, STEP_TOP, 0], ...noGen })

  // 7. Step down
  await api.v1.sketch.line({ id: skId, startPos: [STEP_X, STEP_TOP, 0], endPos: [STEP_X, BASE_BOTTOM, 0], ...noGen })

  // 8. Base bottom to R25
  await api.v1.sketch.line({ id: skId, startPos: [STEP_X, BASE_BOTTOM, 0], endPos: [...R25_BASE, 0], ...noGen })

  // 9. R25 arc: from base tangent to R50 intersection (CW)
  const a9 = await api.v1.sketch.arcByCenter({
    id: skId, startPos: [...R25_BASE, 0], centerPos: [...R25C, 0],
    endPos: [...R50_R25, 0], isClockwise: true, ...noGen,
  })
  console.log('[07] 9. R25 arc:', a9.maxLevel <= 31 ? '✓' : '❌')

  // 10. R50 arc: from R50-R25 intersection CW up the left to R50@135°
  const a10 = await api.v1.sketch.arcByCenter({
    id: skId, startPos: [...R50_R25, 0], centerPos: [0, 0, 0],
    endPos: [...R50_135, 0], isClockwise: true, ...noGen,
  })
  console.log('[07] 10. R50 left arc:', a10.maxLevel <= 31 ? '✓' : '❌')

  // 11. Radial step: R50@135° → R60@135° (short line bridging concentric circles)
  await api.v1.sketch.line({ id: skId, startPos: [...R50_135, 0], endPos: [...R60_135, 0], ...noGen })

  console.log('[07] Profile complete (11 segments)')

  // ====== INTERNAL FEATURES ======
  await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: R_50, ...noGen })
  for (const [bx, by] of BOLTS) {
    await api.v1.sketch.circle({ id: skId, centerPos: [bx, by, 0], radius: R_13, ...noGen })
    await api.v1.sketch.circle({ id: skId, centerPos: [bx, by, 0], radius: R_7, ...noGen })
  }
  await api.v1.sketch.circle({ id: skId, centerPos: [...RB, 0], radius: R_RB_INNER, ...noGen })
  await api.v1.sketch.circle({ id: skId, centerPos: [80, -20, 0], radius: R_MID, ...noGen })

  await snapshot('profile-v3')

  filewrite({
    profilePoints: {
      R60_135, R50_135, R50_R25, R25_BASE,
      upper, lower, bodyRightY: yBR,
    },
    profileSegments: [
      '1. R60 top arc: R60@135° → upper.p1 (CW)',
      '2. Upper arm tangent',
      '3. R22 arc: upper.p2 → lower.p2 (CW)',
      '4. Lower arm tangent → body right wall',
      '5. Body right wall',
      '6. Body bottom (step top)',
      '7. Step down',
      '8. Base bottom → R25',
      '9. R25 arc → R50',
      '10. R50 left arc → R50@135° (CW)',
      '11. Radial step R50→R60',
    ],
  }, 'profile-v3-data')

  return { partId, skId }
}
