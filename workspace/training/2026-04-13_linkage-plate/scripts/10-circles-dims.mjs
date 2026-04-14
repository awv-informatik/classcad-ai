// 10-circles-dims.mjs — All 16 circles + all dimensions
// Dimensions help verify positions and make the drawing readable

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LinkagePlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const noGen = { genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false }
  const PI = Math.PI, cos = Math.cos, sin = Math.sin

  const cc = async (cx, cy, r) =>
    (await api.v1.sketch.circle({ id: skId, centerPos: [cx, cy, 0], radius: r, ...noGen })).result
  const ll = async (x1, y1, x2, y2) =>
    (await api.v1.sketch.line({ id: skId, startPos: [x1, y1, 0], endPos: [x2, y2, 0], ...noGen })).result

  const ang = 40 * PI / 180
  const aD = [cos(ang), sin(ang)]

  // ================================================================
  // CIRCLES
  // ================================================================

  // Left oblong
  const lobeTop750  = await cc(0.750, 0.1875, 0.750)
  const lobeBot750  = await cc(0.750, -0.1875, 0.750)
  const lobeTop437  = await cc(0.750, 0.1875, 0.437)
  const lobeBot437  = await cc(0.750, -0.1875, 0.437)

  // Upper round
  const upper1625 = await cc(1.750, 0.750, 0.8125)
  const upper750  = await cc(1.750, 0.750, 0.375)

  // Middle round (concentric at (1.750, 0))
  const mid1750    = await cc(1.750, 0, 0.875)
  const mid1125    = await cc(1.750, 0, 0.5625)
  const contR1750  = await cc(1.750, 0, 1.750)

  // R1.375 contour
  const contR1375 = await cc(4.062, 0, 1.375)

  // Right arm (on 40° axis from R1.375 center)
  const d1 = 0.500
  const d2 = (5.804 - 0.875 - 4.062) / aD[0]
  const bx = 4.062 + d1 * aD[0], by = d1 * aD[1]
  const tx = 4.062 + d2 * aD[0], ty = d2 * aD[1]

  const armBase875 = await cc(bx, by, 0.875)
  const armTip875  = await cc(tx, ty, 0.875)
  const armBase438 = await cc(bx, by, 0.438)
  const armTip438  = await cc(tx, ty, 0.438)

  // R.625 transitions (analytically computed)
  const r625Upper = await cc(3.149, 1.078, 0.625)
  const r625Lower = await cc(4.259, -0.724, 0.625)

  console.log('[10] 16 circles placed')

  // ================================================================
  // REFERENCE / CONSTRUCTION LINES (for dimensions)
  // ================================================================

  // Horizontal centerline
  const hLine = await ll(-0.5, 0, 6.5, 0)
  // Vertical through main axis
  const vLine = await ll(1.750, -2.5, 1.750, 2.5)
  // Left lobe vertical
  const vLobe = await ll(0.750, -1.5, 0.750, 1.5)
  // 40° arm axis
  const armAxis = await ll(4.062, 0, 4.062 + 2.5*aD[0], 2.5*aD[1])

  // ================================================================
  // GET CENTER POINT IDs (for distance dimensions)
  // ================================================================
  const gp = async (cId) => (await api.v1.sketch.getPoints({ id: cId })).result.centerId

  const ptLobeTop = await gp(lobeTop750)
  const ptLobeBot = await gp(lobeBot750)
  const ptUpper   = await gp(upper1625)
  const ptMid     = await gp(mid1750)
  const ptR1375   = await gp(contR1375)
  const ptArmBase = await gp(armBase875)
  const ptArmTip  = await gp(armTip875)

  // Points on reference lines for datum dimensions
  const hLinePts = (await api.v1.sketch.getPoints({ id: hLine })).result
  const vLinePts = (await api.v1.sketch.getPoints({ id: vLine })).result

  console.log('[10] Center points retrieved')

  // ================================================================
  // DIMENSIONS
  // ================================================================

  const dim = async (type, geomIds, name, opts = {}) => {
    const params = { id: skId, type, geomIds, name, ...opts }
    const r = await api.v1.sketch.dimension(params)
    if (r.maxLevel > 31) console.log(`[10] DIM WARN ${name}:`, r.messages)
    else console.log(`[10] dim ${name}: id=${r.result}`)
    return r.result
  }

  // --- DIAMETERS ---
  await dim('DIAMETER', [upper1625], 'Ø1.625')
  await dim('DIAMETER', [upper750],  'Ø0.750')
  await dim('DIAMETER', [mid1750],   'Ø1.750')
  await dim('DIAMETER', [mid1125],   'Ø1.125')

  // --- RADII ---
  await dim('RADIUS', [contR1750],  'R1.750')
  await dim('RADIUS', [lobeTop750], 'R.750')
  await dim('RADIUS', [lobeTop437], 'R.437')
  await dim('RADIUS', [contR1375],  'R1.375')
  await dim('RADIUS', [r625Upper],  'R.625')
  await dim('RADIUS', [armBase438], 'R.438')
  await dim('RADIUS', [armBase875], 'R.875')

  // --- LINEAR DISTANCES ---

  // L1: .750 — vertical from centerline to upper hole center
  await dim('VERTICAL_DISTANCE', [ptMid, ptUpper], 'L1_0.750')

  // L2: 1.875 — left lobe height (top R.750 center to bot R.750 center + 2*R)
  // Dimension between the top and bottom of the lobe
  // Use tangent point approach: create points at lobe extremes
  // Actually, let's dim between the lobe top center and bot center
  await dim('VERTICAL_DISTANCE', [ptLobeTop, ptLobeBot], 'lobe_centers_0.375')

  // L3: 1.000 — horizontal from left lobe center to main axis
  await dim('HORIZONTAL_DISTANCE', [ptLobeTop, ptMid], 'L3_1.000')

  // L4: 2.312 — horizontal from main axis to R1.375 center
  await dim('HORIZONTAL_DISTANCE', [ptMid, ptR1375], 'L4_2.312')

  // L5: 5.804 — overall width
  // Need leftmost and rightmost points. Use lobe left extent and arm tip right extent.
  // For now, dim between left lobe center and arm tip center (horizontal)
  await dim('HORIZONTAL_DISTANCE', [ptLobeTop, ptArmTip], 'lobe_to_tip_H')

  // Additional useful dims
  await dim('HORIZONTAL_DISTANCE', [ptR1375, ptArmBase], 'R1375_to_armBase_H')
  await dim('HORIZONTAL_DISTANCE', [ptArmBase, ptArmTip],  'armBase_to_tip_H')

  // --- ANGLE ---
  // 40° — angle between horizontal centerline and arm axis
  await dim('ANGLE', [hLine, armAxis], 'A1_40deg', { dimPos: [4.5, 0.5, 0] })

  console.log('[10] All dimensions added')

  await snapshot('circles-dims')

  filewrite({
    circles: {
      lobeTop750, lobeBot750, lobeTop437, lobeBot437,
      upper1625, upper750, mid1750, mid1125, contR1750,
      contR1375, armBase875, armTip875, armBase438, armTip438,
      r625Upper, r625Lower,
    },
    armBase: [bx, by],
    armTip: [tx, ty],
  }, 'all-ids')

  return { partId }
}
