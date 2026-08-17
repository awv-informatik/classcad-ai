// Script 07 — Trim outer profile.
// Method: splitAllCurves → classify each split arc by MIDPOINT → trim bad ones → mergeBack
// Roles:
//   POSITIVE (outer hull): R96, R36R, R36L, R54 → keep segment if midpoint NOT inside any other positive AND NOT inside any negative
//   NEGATIVE (cutouts):    R20R, R20L           → keep segment if midpoint IS inside any positive
//   HOLE (interior):       Ø50, Ø30, 3 holes, Ø40, R35 → keep all segments

export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'Exercise' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  const noGen = { genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false }
  const deg = a => (a * Math.PI) / 180

  // Solve R20c
  function solveR20() {
    const A = 60 * Math.sqrt(3)
    let cy = -21.54
    for (let i = 0; i < 40; i++) {
      const cx = (5264 - 112 * cy) / A
      const f = cx * cx + (cy + 26) * (cy + 26) - 5476
      const fp = 2 * cx * (-112 / A) + 2 * (cy + 26)
      cy -= f / fp
    }
    return { cx: (5264 - 112 * cy) / A, cy }
  }
  const R20c = solveR20()

  const mk = async (cx, cy, r) =>
    (await api.v1.sketch.circle({ id: skId, centerPos: [cx, cy, 0], radius: r, ...noGen })).result

  // Positive: outer hull shapes
  const R96  = await mk(0, 0, 96)
  const R54  = await mk(0, -26, 54)
  const R36c = { x: 60 * Math.cos(deg(30)), y: 60 * Math.sin(deg(30)) }
  const R36R = await mk( R36c.x, R36c.y, 36)
  const R36L = await mk(-R36c.x, R36c.y, 36)

  // Negative: waist cutouts
  const R20R = await mk( R20c.cx, R20c.cy, 20)
  const R20L = await mk(-R20c.cx, R20c.cy, 20)

  // Hole: interior features (do not trim)
  const hub50 = await mk(0, 0, 25)
  const hub_inner = await mk(0, 0, 15)
  const h_right = await mk(64 * Math.cos(deg(30)), 64 * Math.sin(deg(30)), 15)
  const h_top   = await mk(0, 64, 15)
  const h_left  = await mk(64 * Math.cos(deg(150)), 64 * Math.sin(deg(150)), 15)
  const Phi40 = await mk(0, -26, 20)
  const R35   = await mk(0, -26, 35)

  const shapes = {
    [R96]:  { role: 'pos',  cx: 0, cy: 0,           r: 96 },
    [R54]:  { role: 'pos',  cx: 0, cy: -26,         r: 54 },
    [R36R]: { role: 'pos',  cx:  R36c.x, cy: R36c.y, r: 36 },
    [R36L]: { role: 'pos',  cx: -R36c.x, cy: R36c.y, r: 36 },
    [R20R]: { role: 'neg',  cx:  R20c.cx, cy: R20c.cy, r: 20 },
    [R20L]: { role: 'neg',  cx: -R20c.cx, cy: R20c.cy, r: 20 },
    [hub50]: { role: 'hole', cx: 0, cy: 0,         r: 25 },
    [hub_inner]: { role: 'hole', cx: 0, cy: 0,     r: 15 },
    [h_right]: { role: 'hole', cx: 64 * Math.cos(deg(30)), cy: 64 * Math.sin(deg(30)), r: 15 },
    [h_top]:   { role: 'hole', cx: 0, cy: 64,      r: 15 },
    [h_left]:  { role: 'hole', cx: 64 * Math.cos(deg(150)), cy: 64 * Math.sin(deg(150)), r: 15 },
    [Phi40]: { role: 'hole', cx: 0, cy: -26,       r: 20 },
    [R35]:   { role: 'hole', cx: 0, cy: -26,       r: 35 },
  }

  const positives = Object.entries(shapes).filter(([_, s]) => s.role === 'pos').map(([id, s]) => ({ id: +id, ...s }))
  const negatives = Object.entries(shapes).filter(([_, s]) => s.role === 'neg').map(([id, s]) => ({ id: +id, ...s }))

  // Split everything
  const splitIds = (await api.v1.sketch.splitAllCurves({ id: skId })).result
  console.log('[07] splitAllCurves returned', splitIds.length, 'ids')

  // We need to map each split segment back to its HOME circle. Use the structure tree.
  const tree = (await api.v1.common.getDatabaseSettings?.({}))?.structure?.tree
  // Actually, we should inspect via getGeometry or structure tree from last recalc.
  // Let's just grab the structure tree from the part:
  const partInfo = await api.v1.part.getFeature({ id: partId, name: 'Sketch' }).catch(() => null)
  // Alternative: use getGeometry on the sketch
  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  filewrite({ splitIds, geo }, 'split-result')

  // For each split ID, classify
  const trimList = []
  const keepList = []
  for (const sid of splitIds) {
    // Skip if sid is an original home circle (non-intersecting, keep)
    if (sid in shapes) {
      keepList.push({ id: sid, role: shapes[sid].role, reason: 'original-circle' })
      continue
    }
    // Try to get positions (works for arcs)
    const posResp = await api.v1.sketch.getPositions({ id: sid })
    if (posResp.result == null || !posResp.result.startPos) {
      // Not an arc — probably a full circle still (unlikely for split result though)
      keepList.push({ id: sid, reason: 'non-arc' })
      continue
    }
    const { startPos, endPos, centerPos } = posResp.result
    // Identify home circle by matching center to known shapes
    const homeId = Object.keys(shapes).find(k => {
      const s = shapes[+k]
      return Math.hypot(s.cx - centerPos.x, s.cy - centerPos.y) < 0.01
    })
    if (!homeId) {
      console.log('[07] WARN: no home for', sid, 'centerPos', centerPos)
      keepList.push({ id: sid, reason: 'no-home-keep-default' })
      continue
    }
    const home = shapes[+homeId]
    // Compute arc midpoint (short-arc guess): center + r * unit(chord_mid - center)
    const cmx = (startPos.x + endPos.x) / 2
    const cmy = (startPos.y + endPos.y) / 2
    const dx = cmx - centerPos.x, dy = cmy - centerPos.y
    const len = Math.hypot(dx, dy) || 1e-9
    const mx = centerPos.x + home.r * dx / len
    const my = centerPos.y + home.r * dy / len
    const EPS = 1e-3
    const insideOther = (target, shapeList) =>
      shapeList.some(s => s.id !== target && Math.hypot(mx - s.cx, my - s.cy) < s.r - EPS)
    let decision
    if (home.role === 'hole') {
      decision = 'keep'
    } else if (home.role === 'pos') {
      const inOtherPos = insideOther(+homeId, positives)
      const inNeg = insideOther(+homeId, negatives)
      decision = (inOtherPos || inNeg) ? 'trim' : 'keep'
    } else {
      // negative: keep if inside at least one positive
      const inAnyPos = positives.some(p => Math.hypot(mx - p.cx, my - p.cy) < p.r - EPS)
      decision = inAnyPos ? 'keep' : 'trim'
    }
    if (decision === 'trim') trimList.push(sid)
    else keepList.push({ id: sid, home: +homeId, role: home.role, mx, my })
  }

  console.log('[07] trim', trimList.length, 'segments, keep', keepList.length)
  filewrite({ trimList, keepList }, 'classification')

  if (trimList.length > 0) {
    const trimResp = await api.v1.sketch.trimCurves({ id: skId, curveIds: trimList })
    console.log('[07] trimCurves maxLevel:', trimResp.maxLevel, 'msg:', trimResp.messages?.[0]?.message ?? '')
  }
  const mergeResp = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[07] mergeBack maxLevel:', mergeResp.maxLevel)

  await snapshot('07-trimmed')

  const geoFinal = (await api.v1.sketch.getGeometry({ id: skId })).result
  filewrite(geoFinal, 'geometry-final')
  return { skId }
}
