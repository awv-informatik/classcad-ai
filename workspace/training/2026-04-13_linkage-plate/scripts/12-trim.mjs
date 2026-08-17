// 12-trim.mjs — Split all curves, classify segments, trim interior ones
// Classification: segment midpoint inside another contour circle → trim it

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LinkagePlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const noGen = { genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false }
  const PI = Math.PI, cos = Math.cos, sin = Math.sin, sqrt = Math.sqrt, atan2 = Math.atan2

  const ang = 40 * PI / 180
  const aD = [cos(ang), sin(ang)]
  const d1 = 0.500, d2 = (5.804 - 0.875 - 4.062) / aD[0]
  const bx = 4.062 + d1*aD[0], by = d1*aD[1]
  const tx = 4.062 + d2*aD[0], ty = d2*aD[1]

  // ================================================================
  // CIRCLE DEFINITIONS — center, radius, role
  // ================================================================
  const defs = [
    { cx: 0.750, cy: 0.1875,  r: 0.750,  role: 'contour', label: 'R750_top' },
    { cx: 0.750, cy: -0.1875, r: 0.750,  role: 'contour', label: 'R750_bot' },
    { cx: 0.750, cy: 0.1875,  r: 0.437,  role: 'slot',    label: 'R437_top' },
    { cx: 0.750, cy: -0.1875, r: 0.437,  role: 'slot',    label: 'R437_bot' },
    { cx: 1.750, cy: 0.750,   r: 0.8125, role: 'contour', label: 'D1625' },
    { cx: 1.750, cy: 0.750,   r: 0.375,  role: 'hole',    label: 'D0750' },
    { cx: 1.750, cy: 0,       r: 0.875,  role: 'hole',    label: 'D1750' },
    { cx: 1.750, cy: 0,       r: 0.5625, role: 'hole',    label: 'D1125' },
    { cx: 1.750, cy: 0,       r: 1.750,  role: 'contour', label: 'R1750' },
    { cx: 4.062, cy: 0,       r: 1.375,  role: 'contour', label: 'R1375' },
    { cx: bx,    cy: by,      r: 0.875,  role: 'contour', label: 'R875_base' },
    { cx: tx,    cy: ty,      r: 0.875,  role: 'contour', label: 'R875_tip' },
    { cx: bx,    cy: by,      r: 0.438,  role: 'slot',    label: 'R438_base' },
    { cx: tx,    cy: ty,      r: 0.438,  role: 'slot',    label: 'R438_tip' },
    { cx: 3.149, cy: 1.078,   r: 0.625,  role: 'contour', label: 'R625_upper' },
    { cx: 4.259, cy: -0.724,  r: 0.625,  role: 'contour', label: 'R625_lower' },
  ]

  const contourDefs = defs.filter(d => d.role === 'contour')

  // ================================================================
  // CREATE CIRCLES
  // ================================================================
  const circleIds = []
  for (const d of defs) {
    const id = (await api.v1.sketch.circle({
      id: skId, centerPos: [d.cx, d.cy, 0], radius: d.r, ...noGen
    })).result
    circleIds.push(id)
    d.id = id
  }
  console.log(`[12] Created ${circleIds.length} circles`)

  // ================================================================
  // SPLIT ALL CURVES
  // ================================================================
  const splitR = await api.v1.sketch.splitAllCurves({ id: skId })
  const segs = splitR.result
  console.log(`[12] splitAllCurves: ${segs.length} segments`)

  // ================================================================
  // CLASSIFY EACH SEGMENT
  // ================================================================
  const toTrim = []
  const toKeep = []
  let errors = 0

  for (let i = 0; i < segs.length; i++) {
    const segId = segs[i]
    let pos
    try {
      pos = (await api.v1.sketch.getPositions({ id: segId })).result
    } catch (e) { errors++; continue }

    if (!pos) { errors++; continue }

    // Determine parent circle by matching center + radius
    let parent = null
    let segRadius = 0
    if (pos.startPos && pos.centerPos) {
      const dx = pos.startPos.x - pos.centerPos.x
      const dy = pos.startPos.y - pos.centerPos.y
      segRadius = sqrt(dx*dx + dy*dy)
      for (const d of defs) {
        const cdx = pos.centerPos.x - d.cx
        const cdy = pos.centerPos.y - d.cy
        const cdist = sqrt(cdx*cdx + cdy*cdy)
        if (cdist < 0.02 && Math.abs(segRadius - d.r) < 0.02) {
          parent = d
          break
        }
      }
    } else if (pos.centerPos) {
      // Unsplit circle — match by center only, take first radius match
      for (const d of defs) {
        const cdx = pos.centerPos.x - d.cx
        const cdy = pos.centerPos.y - d.cy
        if (sqrt(cdx*cdx + cdy*cdy) < 0.02) {
          parent = d
          break
        }
      }
    }

    if (!parent) { toKeep.push(segId); continue }

    // Compute arc midpoint (on the arc, not chord midpoint)
    let midX, midY
    if (pos.startPos && pos.endPos && pos.centerPos) {
      const sa = atan2(pos.startPos.y - pos.centerPos.y, pos.startPos.x - pos.centerPos.x)
      const ea = atan2(pos.endPos.y - pos.centerPos.y, pos.endPos.x - pos.centerPos.x)
      // Use chord midpoint as approximation (good enough for short arcs)
      midX = (pos.startPos.x + pos.endPos.x) / 2
      midY = (pos.startPos.y + pos.endPos.y) / 2
      // But push it out to the arc radius for better accuracy
      const mDist = sqrt((midX - pos.centerPos.x)**2 + (midY - pos.centerPos.y)**2)
      if (mDist > 0.001) {
        midX = pos.centerPos.x + segRadius * (midX - pos.centerPos.x) / mDist
        midY = pos.centerPos.y + segRadius * (midY - pos.centerPos.y) / mDist
      }
    } else {
      toKeep.push(segId)
      continue
    }

    // CLASSIFY based on role
    if (parent.role === 'contour') {
      // Trim if midpoint is inside ANY OTHER contour circle
      let insideOther = false
      for (const d of contourDefs) {
        if (d === parent) continue
        const dx = midX - d.cx, dy = midY - d.cy
        if (sqrt(dx*dx + dy*dy) < d.r - 0.01) {
          insideOther = true
          break
        }
      }
      if (insideOther) toTrim.push(segId)
      else toKeep.push(segId)
    } else if (parent.role === 'hole') {
      // Holes: keep all segments (they're entirely inside the body)
      toKeep.push(segId)
    } else if (parent.role === 'slot') {
      // Slots: keep segments inside their parent contour circle, trim rest
      // The slot parent is the corresponding outer circle (R.750 for R.437, R.875 for R.438)
      // A slot segment inside the corresponding outer circle = keep (slot boundary)
      let insideParentContour = false
      for (const d of contourDefs) {
        const dx = midX - d.cx, dy = midY - d.cy
        if (sqrt(dx*dx + dy*dy) < d.r - 0.01) {
          insideParentContour = true
          break
        }
      }
      if (insideParentContour) toKeep.push(segId)
      else toTrim.push(segId)
    }
  }

  console.log(`[12] Classification: ${toKeep.length} keep, ${toTrim.length} trim, ${errors} errors`)

  // ================================================================
  // TRIM
  // ================================================================
  if (toTrim.length > 0) {
    const trimR = await api.v1.sketch.trimCurves({ id: skId, curveIds: toTrim })
    if (trimR.maxLevel > 31) {
      console.log(`[12] TRIM ERROR: maxLevel=${trimR.maxLevel}`, trimR.messages?.[0]?.message)
    } else {
      console.log(`[12] trimCurves OK: ${toTrim.length} segments trimmed`)
    }
  }

  // ================================================================
  // MERGE BACK
  // ================================================================
  await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[12] mergeBack complete')

  await snapshot('trimmed')

  filewrite({ kept: toKeep.length, trimmed: toTrim.length, errors }, 'trim-stats')
  return { partId }
}
