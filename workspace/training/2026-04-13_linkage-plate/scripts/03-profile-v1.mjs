// 03-profile-v1.mjs — Focus on profile outline + holes
// Uses analytically computed R1.750 center from tangency constraints
// Origin: left edge x=0, horizontal centerline y=0

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LinkagePlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const noGen = { genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false }

  const PI = Math.PI
  const cos = Math.cos, sin = Math.sin, sqrt = Math.sqrt, atan2 = Math.atan2

  // ================================================================
  // COMPUTED CENTERS
  // ================================================================

  // Left lobe R.750 arcs: from 1.875 height
  const lobe = { x: 0.750, yt: 0.1875, yb: -0.1875 }

  // Through-holes
  const hub1750  = { x: 1.000, y: 0, r: 0.875 }       // Ø1.750
  const upper    = { x: 1.000, y: 0.750, r: 0.8125 }   // Ø1.625
  const smallH   = { x: 1.000, y: 0.750, r: 0.375 }    // Ø0.750 (concentric w/ Ø1.625)
  const hole1125 = { x: 2.300, y: -0.100, r: 0.5625 }  // Ø1.125 (estimated)

  // R1.750: solved from tangent to R.750 top (d=2.500) + tangent to Ø1.625 (d=2.5625)
  const r1750 = { x: 3.056, y: -0.782, r: 1.750 }

  // R1.375: tangent to R1.750 (internal, d = R1.750 - R1.375 = 0.375)
  // x = 3.312 from dimension, y solved: -0.508
  const r1375 = { x: 3.312, y: -0.508, r: 1.375 }

  // 40° arm direction
  const ang = 40 * PI / 180
  const armDir = [cos(ang), sin(ang)]
  const armPerp = [-sin(ang), cos(ang)]

  // Right arm: tip estimated from overall width
  // Rightmost point at x = 5.804
  // Arm tip on axis from body, perpendicular extent = R.875
  // Rough tip position at ~(4.8, 1.0)
  const armTip = { x: 4.800, y: 0.800 }

  // ================================================================
  // HELPERS
  // ================================================================

  const circle = async (cx, cy, r) =>
    (await api.v1.sketch.circle({ id: skId, centerPos: [cx, cy, 0], radius: r, ...noGen })).result

  const line = async (x1, y1, x2, y2) =>
    (await api.v1.sketch.line({ id: skId, startPos: [x1, y1, 0], endPos: [x2, y2, 0], ...noGen })).result

  const arc = async (sx, sy, ex, ey, cx, cy, cw = true) =>
    (await api.v1.sketch.arcByCenter({
      id: skId,
      startPos: [sx, sy, 0], endPos: [ex, ey, 0], centerPos: [cx, cy, 0],
      isClockwise: cw, ...noGen
    })).result

  // Tangent point between two tangent circles (from center1 toward center2, at radius1)
  function tangentPt(c1, c2, r1) {
    const dx = c2.x - c1.x, dy = c2.y - c1.y
    const d = sqrt(dx*dx + dy*dy)
    return { x: c1.x + r1 * dx/d, y: c1.y + r1 * dy/d }
  }

  // ================================================================
  // THROUGH-HOLES
  // ================================================================
  await circle(hub1750.x, hub1750.y, hub1750.r)
  await circle(upper.x, upper.y, upper.r)
  await circle(smallH.x, smallH.y, smallH.r)
  await circle(hole1125.x, hole1125.y, hole1125.r)
  console.log('[03] Through-holes placed')

  // ================================================================
  // LEFT LOBE OUTLINE
  // ================================================================

  // Outer: two R.750 semicircles + two straight sides
  // Top semicircle: from (1.500, 0.1875) CCW to (0, 0.1875) centered at (0.750, 0.1875)
  await arc(1.500, lobe.yt, 0, lobe.yt, lobe.x, lobe.yt, false)
  // Left straight side
  await line(0, lobe.yt, 0, lobe.yb)
  // Bottom semicircle: from (0, -0.1875) CCW to (1.500, -0.1875)
  await arc(0, lobe.yb, 1.500, lobe.yb, lobe.x, lobe.yb, false)
  // Right straight side
  await line(1.500, lobe.yb, 1.500, lobe.yt)

  // Inner slot: two R.437 semicircles + two straight sides
  const slotR = 0.437
  const slotRight = lobe.x + slotR  // 1.187
  const slotLeft = lobe.x - slotR   // 0.313
  await arc(slotRight, lobe.yt, slotLeft, lobe.yt, lobe.x, lobe.yt, false)
  await line(slotLeft, lobe.yt, slotLeft, lobe.yb)
  await arc(slotLeft, lobe.yb, slotRight, lobe.yb, lobe.x, lobe.yb, false)
  await line(slotRight, lobe.yb, slotRight, lobe.yt)

  console.log('[03] Left lobe placed')

  // ================================================================
  // PROFILE ARCS (key transitions)
  // ================================================================

  // R1.750 arc: tangent to R.750 top → tangent to Ø1.625
  const tp1 = tangentPt(r1750, { x: lobe.x, y: lobe.yt }, r1750.r)  // toward R.750 top center
  const tp2 = tangentPt(r1750, upper, r1750.r)                        // toward Ø1.625 center

  console.log(`[03] R1.750 tangent points: tp1=(${tp1.x.toFixed(3)}, ${tp1.y.toFixed(3)}), tp2=(${tp2.x.toFixed(3)}, ${tp2.y.toFixed(3)})`)

  // Draw R1.750 arc from tp1 to tp2 (clockwise since center is below/right)
  await arc(tp1.x, tp1.y, tp2.x, tp2.y, r1750.x, r1750.y, true)

  // Ø1.625 boss arc: from tp2 going CW over the top of the boss
  // The profile follows the Ø1.625 circle from the R1.750 tangent point
  // going CW (up and over) to where the next arc (R.625 or right arm transition) begins
  // For now, draw the upper half of the Ø1.625 circle
  const bossRight = { x: upper.x + upper.r, y: upper.y }
  await arc(tp2.x, tp2.y, bossRight.x, bossRight.y, upper.x, upper.y, true)

  // R1.375 arc: draw lower profile
  // The R1.375 arc sweeps along the bottom from right toward center
  // Tangent point with R1.750 (internal tangent):
  const tp3 = tangentPt(r1750, r1375, r1750.r)
  // R1.375's leftmost extent
  const r1375Left = { x: r1375.x - r1375.r, y: r1375.y }
  console.log(`[03] R1.375 tangent with R1.750: (${tp3.x.toFixed(3)}, ${tp3.y.toFixed(3)})`)
  console.log(`[03] R1.375 left extent: (${r1375Left.x.toFixed(3)}, ${r1375Left.y.toFixed(3)})`)

  // Draw R1.375 arc (partial, lower profile)
  // From its left extent going CW to a point toward the right arm
  const r1375Right = { x: r1375.x + r1375.r * cos(-0.3), y: r1375.y + r1375.r * sin(-0.3) }
  await arc(r1375Left.x, r1375Left.y, r1375Right.x, r1375Right.y, r1375.x, r1375.y, true)

  // Right arm: rough R.875 circles at tip
  await circle(armTip.x + 0.875 * armPerp[0], armTip.y + 0.875 * armPerp[1], 0.875)
  await circle(armTip.x - 0.875 * armPerp[0], armTip.y - 0.875 * armPerp[1], 0.875)

  console.log('[03] Profile arcs placed')

  // Reference: 40° construction line
  await line(2.500, -0.500, 2.500 + 4*armDir[0], -0.500 + 4*armDir[1])

  filewrite({
    r1750, r1375, tp1, tp2, tp3,
    lobeTop: { x: lobe.x, y: lobe.yt },
    lobeBot: { x: lobe.x, y: lobe.yb },
  }, 'profile-data')

  await snapshot('profile-v1')
  return { partId }
}
