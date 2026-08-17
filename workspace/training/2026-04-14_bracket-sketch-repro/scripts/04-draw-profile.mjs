// Script 04: Draw the final profile directly using arcs and lines
// Outer profile + internal holes — no trim step needed
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Bracket' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const noGen = {
    genFixation: false, genIncidence: false,
    genVertAndHoriz: false, genTangency: false,
  }

  // ====== CONSTANTS ======
  const HUB = [0, 0]
  const RB = [148, -2]           // right boss center
  const R_HUB = 50               // Ø100
  const R_OUTER = 60             // R60
  const R_BOSS = 13              // 4×R13
  const R_BOLTHOLE = 7           // 4×Ø14
  const R_RB_OUTER = 22          // Ø44
  const R_RB_INNER = 9.5         // Ø19
  const R_MID = 10               // Ø20
  const R_CORNER = 25            // R25
  const BOLT_CIRCLE = 35.36      // derived from dim 38
  const BASE_BOTTOM = -57        // derived
  const STEP_TOP = BASE_BOTTOM + 22  // = -35
  const STEP_X = 72 - 33         // = 39
  const BODY_RIGHT = 108         // = 170 - 62
  const BASE_LEFT = -28          // dim 28
  const BASE_RIGHT = 72          // dim 72

  // Bolt positions at 45° intervals
  const BOLTS = [[-25, 25], [25, 25], [-25, -25], [25, -25]]

  // R25 center: tangent to x=BASE_LEFT and y=BASE_BOTTOM
  const R25C = [BASE_LEFT + R_CORNER, BASE_BOTTOM + R_CORNER] // = (-3, -32)

  // ====== TANGENT COMPUTATIONS ======
  function tangentPoints(c1, r1, c2, r2, side) {
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

  // Upper arm: R60 → R22
  const upper = tangentPoints(HUB, R_OUTER, RB, R_RB_OUTER, 'upper')
  // Lower arm: R50 → R22
  const lower = tangentPoints(HUB, R_HUB, RB, R_RB_OUTER, 'lower')

  // Lower arm tangent at BODY_RIGHT
  const tBR = (BODY_RIGHT - lower.p1[0]) / (lower.p2[0] - lower.p1[0])
  const yBR = lower.p1[1] + tBR * (lower.p2[1] - lower.p1[1])

  console.log('[04] upper: (%.2f,%.2f)→(%.2f,%.2f)', ...upper.p1, ...upper.p2)
  console.log('[04] lower: (%.2f,%.2f)→(%.2f,%.2f)', ...lower.p1, ...lower.p2)
  console.log('[04] lower arm at x=%d: y=%.2f', BODY_RIGHT, yBR)

  // R50-R25 intersection (where hub contour meets the corner arc)
  // R50: x²+y²=2500, R25: (x-R25C[0])²+(y-R25C[1])²=625
  // Solved: y ≈ -43.1, x ≈ -25.1 (lower-left intersection)
  const cx = R25C[0], cy = R25C[1]
  // Subtract: x²+y² - ((x-cx)²+(y-cy)²) = 2500-625
  // x² + y² - x² + 2cx*x - cx² - y² + 2cy*y - cy² = 1875
  // 2cx*x + 2cy*y = 1875 + cx² + cy²
  const K = (R_HUB ** 2 - R_CORNER ** 2 + cx ** 2 + cy ** 2) / 2
  // cx*x + cy*y = K → x = (K - cy*y) / cx
  // Substitute into R50: ((K-cy*y)/cx)² + y² = R_HUB²
  const A = (cy / cx) ** 2 + 1
  const B = -2 * K * cy / (cx ** 2)
  const C = (K / cx) ** 2 - R_HUB ** 2
  const disc = B * B - 4 * A * C
  const y1 = (-B - Math.sqrt(disc)) / (2 * A)
  const y2 = (-B + Math.sqrt(disc)) / (2 * A)
  const x1 = (K - cy * y1) / cx
  const x2 = (K - cy * y2) / cx

  // Pick the lower-left intersection
  const hubR25 = x1 < x2 ? [x1, y1] : [x2, y2]
  console.log('[04] R50-R25 intersection: (%.2f, %.2f)', hubR25[0], hubR25[1])

  // R25 tangent to y=BASE_BOTTOM: at x = R25C[0], y = BASE_BOTTOM → point (-3, -57)
  const r25Base = [R25C[0], BASE_BOTTOM]

  // R60 at x=BASE_LEFT: y = sqrt(R_OUTER²-BASE_LEFT²)
  const r60AtWall = Math.sqrt(R_OUTER ** 2 - BASE_LEFT ** 2)
  // Upper intersection: (BASE_LEFT, r60AtWall) ≈ (-28, 53.07)

  // Where to start the body left wall: from R50 at the lower left
  // R50 at x=BASE_LEFT: y = -sqrt(R_HUB² - BASE_LEFT²)
  const r50AtWall = -Math.sqrt(R_HUB ** 2 - BASE_LEFT ** 2)
  console.log('[04] R60 at x=%d: y=%.2f; R50 at x=%d: y=%.2f', BASE_LEFT, r60AtWall, BASE_LEFT, r50AtWall)

  // ====== DRAW OUTER PROFILE (clockwise from top) ======

  // 1. R60 arc at top: from upper arm tangent start → left side of hub
  // We go from upper.p1 counterclockwise to some point on the left.
  // Use R50 arc for the left-bottom portion instead of R60.
  // Profile: R60 top → transitions to body at left wall
  // R60 at x=BASE_LEFT upper intersection: (-28, 53.07)
  const r60LeftUpper = [BASE_LEFT, r60AtWall]

  const arc_r60 = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [...r60LeftUpper, 0],
    centerPos: [0, 0, 0],
    endPos: [...upper.p1, 0],
    isClockwise: true, // CW from left-upper to upper-arm-tangent (going over the top)
    ...noGen,
  })
  console.log('[04] R60 arc:', arc_r60.maxLevel <= 31 ? '✓' : '❌', arc_r60.result)

  // 2. Upper arm tangent line
  const upperLine = (await api.v1.sketch.line({
    id: skId, startPos: [...upper.p1, 0], endPos: [...upper.p2, 0], ...noGen,
  })).result

  // 3. R22 arc on right boss (from upper tangent end to lower tangent end, CW = right side)
  const arc_rb = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [...upper.p2, 0],
    centerPos: [...RB, 0],
    endPos: [...lower.p2, 0],
    isClockwise: true,
    ...noGen,
  })
  console.log('[04] R22 arc:', arc_rb.maxLevel <= 31 ? '✓' : '❌', arc_rb.result)

  // 4. Lower arm tangent line (only from R22 to body right wall at x=108)
  const lowerLine = (await api.v1.sketch.line({
    id: skId, startPos: [...lower.p2, 0], endPos: [BODY_RIGHT, yBR, 0], ...noGen,
  })).result

  // 5. Body right wall: (108, yBR) → (108, STEP_TOP)
  const rightWall = (await api.v1.sketch.line({
    id: skId, startPos: [BODY_RIGHT, yBR, 0], endPos: [BODY_RIGHT, STEP_TOP, 0], ...noGen,
  })).result

  // 6. Body bottom: (108, STEP_TOP) → (BASE_RIGHT, STEP_TOP)
  // Actually step top runs from STEP_X to BASE_RIGHT
  // But body continues from BODY_RIGHT to BASE_RIGHT at STEP_TOP level too
  // Full line from BASE_RIGHT to BODY_RIGHT at STEP_TOP
  const bodyBottom = (await api.v1.sketch.line({
    id: skId, startPos: [BODY_RIGHT, STEP_TOP, 0], endPos: [BASE_RIGHT, STEP_TOP, 0], ...noGen,
  })).result

  // 7. Step down: (BASE_RIGHT, STEP_TOP) → (BASE_RIGHT, STEP_TOP) to (STEP_X, STEP_TOP) is already
  // Wait: step is at the LEFT of the base (x=STEP_X to BASE_RIGHT)
  // The step goes: (BASE_RIGHT, STEP_TOP) down to (BASE_RIGHT, BASE_BOTTOM)... no.
  // Step profile: from STEP_X the bottom drops, at BASE_RIGHT the step rises
  // Let me re-examine:
  // - Base bottom at y=BASE_BOTTOM from x=-3 (R25) to x=STEP_X (=39)
  // - Step up from (STEP_X, BASE_BOTTOM) to (STEP_X, STEP_TOP)
  // - Step top from (STEP_X, STEP_TOP) to (BASE_RIGHT, STEP_TOP)
  // - And I need to connect (BASE_RIGHT, STEP_TOP) back up to BODY_RIGHT...
  // Actually, above I already connected BODY_RIGHT to BASE_RIGHT at STEP_TOP level.
  // So: body bottom + step top are on the same horizontal at STEP_TOP.
  // The step goes DOWN from STEP_TOP to BASE_BOTTOM between x=-3 and x=STEP_X.

  // 7. Step top to step left: (STEP_X, STEP_TOP) → (STEP_X, BASE_BOTTOM)
  const stepDown = (await api.v1.sketch.line({
    id: skId, startPos: [STEP_X, STEP_TOP, 0], endPos: [STEP_X, BASE_BOTTOM, 0], ...noGen,
  })).result

  // 8. Base bottom: (STEP_X, BASE_BOTTOM) → R25 tangent point on base bottom
  const baseBottom = (await api.v1.sketch.line({
    id: skId, startPos: [STEP_X, BASE_BOTTOM, 0], endPos: [...r25Base, 0], ...noGen,
  })).result

  // 9. R25 arc from base bottom tangent to R50 intersection
  const arc_r25 = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [...r25Base, 0],
    centerPos: [...R25C, 0],
    endPos: [...hubR25, 0],
    isClockwise: true, // CW from bottom to upper-left
    ...noGen,
  })
  console.log('[04] R25 arc:', arc_r25.maxLevel <= 31 ? '✓' : '❌', arc_r25.result)

  // 10. R50 arc from R25 intersection back up to R60 left-upper
  // R50 goes from hubR25 (lower-left) counterclockwise up the left side
  // But R50 and R60 are concentric — we need intermediate geometry.
  // For now: body left wall connects R50 to R60.
  // R50 arc: from lower.p1 (lower arm tangent exit) around bottom to hubR25
  // Then left wall: from hubR25 up to r60LeftUpper

  // Wait — hubR25 is the R50-R25 intersection, not on x=BASE_LEFT.
  // hubR25 ≈ (-25.1, -43.1). R50 continues from there going up-left.
  // R50 at x=BASE_LEFT: y = r50AtWall ≈ -41.4 (lower intersection)
  // The profile should follow R50 from hubR25 to a point, then transition to
  // the body left wall, then up to R60.

  // Simplification: draw R50 arc from lower.p1 to hubR25
  const arc_r50 = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [...hubR25, 0],
    centerPos: [0, 0, 0],
    endPos: [...lower.p1, 0],
    isClockwise: true, // CW from hubR25 (lower-left) to lower.p1 (lower-right)
    ...noGen,
  })
  console.log('[04] R50 arc:', arc_r50.maxLevel <= 31 ? '✓' : '❌', arc_r50.result)

  // 11. Body left wall: from R60 left upper down to R50-R25 intersection (hubR25)
  // This connects R60 to R50 via a vertical line at approximately x=-26
  // Actually hubR25 is at x≈-25, not x=-28. Let me use a line from r60LeftUpper to hubR25.
  const leftWall = (await api.v1.sketch.line({
    id: skId, startPos: [...r60LeftUpper, 0], endPos: [...hubR25, 0], ...noGen,
  })).result

  console.log('[04] Profile drawn. Lines: upper=%d lower=%d rightWall=%d bodyBottom=%d stepDown=%d base=%d leftWall=%d',
    upperLine, lowerLine, rightWall, bodyBottom, stepDown, baseBottom, leftWall)

  // ====== INTERNAL HOLES ======

  // Ø100 bore (R50) — if it's a bore, draw as circle
  // For now, treat R50 as the hub outer contour (already used as arc above)
  // The 4 bolt holes + bosses are internal features

  for (const [bx, by] of BOLTS) {
    await api.v1.sketch.circle({ id: skId, centerPos: [bx, by, 0], radius: R_BOSS, ...noGen })
    await api.v1.sketch.circle({ id: skId, centerPos: [bx, by, 0], radius: R_BOLTHOLE, ...noGen })
  }

  // Right boss inner hole
  await api.v1.sketch.circle({ id: skId, centerPos: [...RB, 0], radius: R_RB_INNER, ...noGen })

  // Ø20 intermediate hole (position estimated)
  await api.v1.sketch.circle({ id: skId, centerPos: [80, -20, 0], radius: R_MID, ...noGen })

  await snapshot('profile')

  filewrite({
    upper, lower, hubR25, r25Base, r60LeftUpper,
    lowerAtBodyRight: yBR,
    r50AtWall,
  }, 'profile-data')

  return { partId, skId }
}
