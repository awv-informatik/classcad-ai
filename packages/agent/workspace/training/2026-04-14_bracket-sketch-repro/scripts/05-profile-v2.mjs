// Script 05: Profile v2 — R60 curved left side, R25 corner, dimensions
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
  const R_RB_INNER = 9.5, R_MID = 10, R25 = 25
  const BASE_BOTTOM = -57, STEP_TOP = -35, STEP_X = 39
  const BODY_RIGHT = 108, BASE_LEFT = -28, BASE_RIGHT = 72
  const BOLTS = [[-25, 25], [25, 25], [-25, -25], [25, -25]]
  const R25C = [BASE_LEFT + R25, BASE_BOTTOM + R25] // (-3, -32)

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

  // R60 at y = BASE_BOTTOM (where R60 circle meets the base level)
  const r60BaseX = -Math.sqrt(R60 ** 2 - BASE_BOTTOM ** 2) // x = -sqrt(3600-3249) = -18.74
  const R60_BASE = [r60BaseX, BASE_BOTTOM]
  console.log('[05] R60 meets base at (%.2f, %d)', r60BaseX, BASE_BOTTOM)

  // Tangent computations
  const upper = tangent(HUB, R60, RB, R22, 'upper')
  const lower = tangent(HUB, R50, RB, R22, 'lower')

  // Lower arm tangent at x = BODY_RIGHT
  const tBR = (BODY_RIGHT - lower.p1[0]) / (lower.p2[0] - lower.p1[0])
  const yBR = lower.p1[1] + tBR * (lower.p2[1] - lower.p1[1])

  // Lower arm tangent at y = STEP_TOP (where arm crosses body floor)
  const tStep = (STEP_TOP - lower.p1[1]) / (lower.p2[1] - lower.p1[1])
  const xArmStep = lower.p1[0] + tStep * (lower.p2[0] - lower.p1[0])
  console.log('[05] arm crosses step_top at x=%.1f', xArmStep)

  // R60 at x = BASE_LEFT: upper point
  const r60LeftY = Math.sqrt(R60 ** 2 - BASE_LEFT ** 2)
  const R60_LEFT_UP = [BASE_LEFT, r60LeftY]

  console.log('[05] upper tangent: (%.1f,%.1f)→(%.1f,%.1f)', ...upper.p1, ...upper.p2)
  console.log('[05] lower tangent: (%.1f,%.1f)→(%.1f,%.1f)', ...lower.p1, ...lower.p2)

  // ====== OUTER PROFILE (clockwise from top) ======

  // 1. R60 arc: from R60_LEFT_UP counterclockwise over the top to upper.p1
  //    = CW from R60_LEFT_UP to upper.p1
  await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [...R60_LEFT_UP, 0],
    centerPos: [0, 0, 0],
    endPos: [...upper.p1, 0],
    isClockwise: true,
    ...noGen,
  })

  // 2. Upper arm tangent
  await api.v1.sketch.line({
    id: skId, startPos: [...upper.p1, 0], endPos: [...upper.p2, 0], ...noGen,
  })

  // 3. R22 arc: upper.p2 → lower.p2 (CW around right boss)
  await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [...upper.p2, 0],
    centerPos: [...RB, 0],
    endPos: [...lower.p2, 0],
    isClockwise: true,
    ...noGen,
  })

  // 4. Lower arm tangent: lower.p2 → body right wall junction
  //    The arm crosses STEP_TOP at x≈88. Use BODY_RIGHT if arm is above step there.
  //    If arm at BODY_RIGHT is above STEP_TOP, use BODY_RIGHT.
  //    Otherwise use xArmStep.
  const useBodyRight = yBR > STEP_TOP  // yBR = -31.5, STEP_TOP = -35, so yBR > STEP_TOP ✓
  const lowerEndX = useBodyRight ? BODY_RIGHT : xArmStep
  const lowerEndY = useBodyRight ? yBR : STEP_TOP

  await api.v1.sketch.line({
    id: skId, startPos: [...lower.p2, 0], endPos: [lowerEndX, lowerEndY, 0], ...noGen,
  })

  // 5. Body right wall: (lowerEndX, lowerEndY) → (lowerEndX, STEP_TOP)
  if (useBodyRight) {
    await api.v1.sketch.line({
      id: skId, startPos: [BODY_RIGHT, yBR, 0], endPos: [BODY_RIGHT, STEP_TOP, 0], ...noGen,
    })
  }

  // 6. Body bottom / step top: (BODY_RIGHT, STEP_TOP) → (STEP_X, STEP_TOP)
  await api.v1.sketch.line({
    id: skId, startPos: [BODY_RIGHT, STEP_TOP, 0], endPos: [STEP_X, STEP_TOP, 0], ...noGen,
  })

  // 7. Step down: (STEP_X, STEP_TOP) → (STEP_X, BASE_BOTTOM)
  await api.v1.sketch.line({
    id: skId, startPos: [STEP_X, STEP_TOP, 0], endPos: [STEP_X, BASE_BOTTOM, 0], ...noGen,
  })

  // 8. Base bottom: (STEP_X, BASE_BOTTOM) → R60_BASE
  await api.v1.sketch.line({
    id: skId, startPos: [STEP_X, BASE_BOTTOM, 0], endPos: [...R60_BASE, 0], ...noGen,
  })

  // 9. R60 arc: from R60_BASE back up left to R60_LEFT_UP
  //    Goes counterclockwise from lower to upper on the left side
  //    = CW from R60_BASE to R60_LEFT_UP would go the long way around (through right)
  //    = CCW (isClockwise=false) from R60_BASE to R60_LEFT_UP goes up the left side
  await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [...R60_BASE, 0],
    centerPos: [0, 0, 0],
    endPos: [...R60_LEFT_UP, 0],
    isClockwise: false,
    ...noGen,
  })

  console.log('[05] Outer profile drawn')

  // ====== INTERNAL FEATURES ======

  // Ø100 hub bore (R50)
  await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: R50, ...noGen })

  // 4× bolt bosses (R13) and holes (R7)
  for (const [bx, by] of BOLTS) {
    await api.v1.sketch.circle({ id: skId, centerPos: [bx, by, 0], radius: R13, ...noGen })
    await api.v1.sketch.circle({ id: skId, centerPos: [bx, by, 0], radius: R7, ...noGen })
  }

  // Right boss inner (R9.5)
  await api.v1.sketch.circle({ id: skId, centerPos: [...RB, 0], radius: R_RB_INNER, ...noGen })

  // Ø20 hole (R10) — estimated position
  await api.v1.sketch.circle({ id: skId, centerPos: [80, -20, 0], radius: R_MID, ...noGen })

  await snapshot('profile-v2')

  // ====== DIMENSIONS for verification ======
  // Get geometry for dimensioning
  const geom = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[05] geometry: %d circles, %d arcs, %d lines',
    geom.result.circles.length, geom.result.arcs.length, geom.result.lines.length)

  filewrite({
    R60_BASE, R60_LEFT_UP, upper, lower, yBR, xArmStep,
    lowerEndX, lowerEndY,
  }, 'positions')

  return { partId, skId }
}
