// Verify OFFSET auto-computed values by using updateDimension and checking paramName
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Rectangle 100x60
  const rect = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [100, 60, 0] })).result

  // OFFSET on bottom line (length 100)
  const d1 = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rect[0]], name: 'w' })).result
  // OFFSET on right line (length 60)
  const d2 = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rect[1]], name: 'h' })).result
  // OFFSET between bottom and top (distance 60)
  const d3 = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rect[0], rect[2]], name: 'gap' })).result
  // HORIZONTAL_DISTANCE on bottom (100)
  const d4 = (await api.v1.sketch.dimension({ id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [rect[0]], name: 'hd' })).result
  // VERTICAL_DISTANCE on right (60)
  const d5 = (await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [rect[1]], name: 'vd' })).result

  // Now update each dim to a specific value and check structure
  await api.v1.sketch.updateDimension({ id: d1, value: 100 })
  await api.v1.sketch.updateDimension({ id: d2, value: 60 })
  await api.v1.sketch.updateDimension({ id: d3, value: 60 })
  await api.v1.sketch.updateDimension({ id: d4, value: 100 })
  const lastR = await api.v1.sketch.updateDimension({ id: d5, value: 60 })

  // Extract paramName to see what updateDimension stores
  const dimIds = [d1, d2, d3, d4, d5]
  function findNodes(obj, ids) {
    const res = []
    if (!obj || typeof obj !== 'object') return res
    if (ids.includes(obj.id)) {
      const m = obj.members || {}
      res.push({
        id: obj.id, name: obj.name,
        orientationType: m.orientationType?.value,
        angle: m.angle?.value,
        paramName: m.paramName?.value,
        startPt: m.startPt?.value,
        endPt: m.endPt?.value,
      })
      return res
    }
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) {
        for (const item of obj[key]) res.push(...findNodes(item, ids))
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        res.push(...findNodes(obj[key], ids))
      }
    }
    return res
  }

  const nodes = findNodes(lastR.structure, dimIds)
  filewrite(nodes, 'offset-values')
  for (const n of nodes) {
    const dx = Math.abs(n.endPt.x - n.startPt.x)
    const dy = Math.abs(n.endPt.y - n.startPt.y)
    const dist = Math.sqrt(dx*dx + dy*dy)
    console.log(`[13] ${n.name}: paramName="${n.paramName}" orient=${n.orientationType} angle=${n.angle?.toFixed(4)} computed_dist=${dist.toFixed(2)} dx=${dx} dy=${dy}`)
  }

  return { partId }
}
