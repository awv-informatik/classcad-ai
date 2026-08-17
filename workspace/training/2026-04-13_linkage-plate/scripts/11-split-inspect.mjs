// 11-split-inspect.mjs — Split all curves and inspect segments before trimming
// Step 1: create circles, splitAllCurves, log each segment with midpoint
// Then we'll decide what to trim in the next script

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LinkagePlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const noGen = { genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false }
  const PI = Math.PI, cos = Math.cos, sin = Math.sin, sqrt = Math.sqrt

  const cc = async (cx, cy, r, label) => {
    const id = (await api.v1.sketch.circle({ id: skId, centerPos: [cx, cy, 0], radius: r, ...noGen })).result
    return { id, cx, cy, r, label }
  }

  const ang = 40 * PI / 180
  const aD = [cos(ang), sin(ang)]
  const d1 = 0.500
  const d2 = (5.804 - 0.875 - 4.062) / aD[0]
  const bx = 4.062 + d1*aD[0], by = d1*aD[1]
  const tx = 4.062 + d2*aD[0], ty = d2*aD[1]

  // ================================================================
  // CREATE ALL 16 CIRCLES (in known order)
  // ================================================================
  const circles = [
    await cc(0.750, 0.1875, 0.750,  '01_R750_top'),
    await cc(0.750, -0.1875, 0.750, '02_R750_bot'),
    await cc(0.750, 0.1875, 0.437,  '03_R437_top'),
    await cc(0.750, -0.1875, 0.437, '04_R437_bot'),
    await cc(1.750, 0.750, 0.8125,  '05_D1625'),
    await cc(1.750, 0.750, 0.375,   '06_D0750'),
    await cc(1.750, 0, 0.875,       '07_D1750'),
    await cc(1.750, 0, 0.5625,      '08_D1125'),
    await cc(1.750, 0, 1.750,       '09_R1750'),
    await cc(4.062, 0, 1.375,       '10_R1375'),
    await cc(bx, by, 0.875,         '11_R875_base'),
    await cc(tx, ty, 0.875,         '12_R875_tip'),
    await cc(bx, by, 0.438,         '13_R438_base'),
    await cc(tx, ty, 0.438,         '14_R438_tip'),
    await cc(3.149, 1.078, 0.625,   '15_R625_upper'),
    await cc(4.259, -0.724, 0.625,  '16_R625_lower'),
  ]

  console.log(`[11] Created ${circles.length} circles`)

  // ================================================================
  // SPLIT ALL CURVES
  // ================================================================
  const splitResult = await api.v1.sketch.splitAllCurves({ id: skId })
  const segments = splitResult.result
  console.log(`[11] splitAllCurves returned ${segments.length} segments`)

  // ================================================================
  // INSPECT EACH SEGMENT — get midpoint position
  // ================================================================
  const segInfo = []
  for (let i = 0; i < segments.length; i++) {
    const segId = segments[i]
    try {
      const pos = await api.v1.sketch.getPositions({ id: segId })
      const p = pos.result
      // For arcs: startPos, endPos, centerPos
      // For unsplit circles: centerPos only? Or null?
      let midX, midY, info
      if (p && p.startPos && p.endPos) {
        // Arc segment — compute midpoint of arc as average of start and end
        midX = (p.startPos.x + p.endPos.x) / 2
        midY = (p.startPos.y + p.endPos.y) / 2
        info = {
          idx: i, id: segId,
          start: [+p.startPos.x.toFixed(3), +p.startPos.y.toFixed(3)],
          end: [+p.endPos.x.toFixed(3), +p.endPos.y.toFixed(3)],
          center: p.centerPos ? [+p.centerPos.x.toFixed(3), +p.centerPos.y.toFixed(3)] : null,
          mid: [+midX.toFixed(3), +midY.toFixed(3)],
        }
      } else if (p && p.centerPos) {
        // Unsplit circle
        info = {
          idx: i, id: segId,
          center: [+p.centerPos.x.toFixed(3), +p.centerPos.y.toFixed(3)],
          note: 'unsplit circle',
        }
      } else {
        info = { idx: i, id: segId, raw: p }
      }

      // Identify parent circle by checking which circle center matches
      if (info.center) {
        for (const c of circles) {
          const dx = info.center[0] - c.cx
          const dy = info.center[1] - c.cy
          if (sqrt(dx*dx + dy*dy) < 0.01) {
            info.parent = c.label
            info.parentR = c.r
            break
          }
        }
      }

      segInfo.push(info)
    } catch (e) {
      segInfo.push({ idx: i, id: segId, error: e.message || 'unknown' })
    }
  }

  // Log summary
  const parents = {}
  for (const s of segInfo) {
    const p = s.parent || 'unknown'
    parents[p] = (parents[p] || 0) + 1
  }
  console.log('[11] Segments per circle:')
  for (const [p, count] of Object.entries(parents)) {
    console.log(`  ${p}: ${count} segments`)
  }

  filewrite(segInfo, 'split-segments')
  filewrite(parents, 'segment-counts')

  console.log('[11] Segment data written to files')

  // Don't trim yet — just inspect
  // Merge back to restore original state
  await api.v1.sketch.splitCurvesMergeBack({ id: skId })

  await snapshot('split-inspect')
  return { partId }
}
