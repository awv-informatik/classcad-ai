// Investigate orientationType values for linear dimensions
// Prior data: OFFSET=2, HORIZONTAL_DISTANCE=1, VERTICAL_DISTANCE=0
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Diagonal line
  const line = (await api.v1.sketch.line({ id: skId, startPos: [10, 20, 0], endPos: [80, 60, 0] })).result

  // Create all 3 linear dim types on the same line
  const dOff = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [line], name: 'off' })
  const dHD = await api.v1.sketch.dimension({ id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [line], name: 'hd' })
  const dVD = await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [line], name: 'vd' })

  console.log('[11] OFFSET:', dOff.result, 'HD:', dHD.result, 'VD:', dVD.result)

  // Extract structure
  const dimIds = [dOff.result, dHD.result, dVD.result].filter(Boolean)
  function findNodes(obj, ids) {
    const results = []
    if (!obj || typeof obj !== 'object') return results
    if (ids.includes(obj.id)) {
      const m = obj.members || {}
      results.push({
        id: obj.id, name: obj.name,
        orientationType: m.orientationType?.value,
        startPt: m.startPt?.value,
        endPt: m.endPt?.value,
        angle: m.angle?.value,
        paramName: m.paramName?.value,
      })
      return results
    }
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) {
        for (const item of obj[key]) results.push(...findNodes(item, ids))
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        results.push(...findNodes(obj[key], ids))
      }
    }
    return results
  }

  const nodes = findNodes(dVD.structure, dimIds)
  filewrite(nodes, 'orientation-summary')

  // The "distance" measured by each:
  // OFFSET: distance along the line (sqrt((80-10)^2 + (60-20)^2) = sqrt(4900+1600) = sqrt(6500) ≈ 80.62)
  // HD: horizontal distance (|80-10| = 70)
  // VD: vertical distance (|60-20| = 40)
  // The "angle" member tells the measurement direction

  for (const n of nodes) {
    const dx = n.endPt.x - n.startPt.x
    const dy = n.endPt.y - n.startPt.y
    // For OFFSET, distance is the full Euclidean distance
    // For HD, distance is |dx|
    // For VD, distance is |dy|
    // But the angle tells which component:
    //   angle=0 → horizontal (X) component
    //   angle=π/2 → vertical (Y) component
    //   angle matching the line angle → along the line (Euclidean)
    console.log(`[11] ${n.name}: orient=${n.orientationType} angle=${n.angle?.toFixed(4)} dx=${dx} dy=${dy}`)
  }

  await snapshot('orientation')
  return { partId }
}
