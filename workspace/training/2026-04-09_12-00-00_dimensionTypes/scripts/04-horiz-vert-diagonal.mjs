// Test HORIZONTAL_DISTANCE and VERTICAL_DISTANCE on diagonal lines and various geometry
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a diagonal line from (10, 20) to (80, 60)
  const diagLine = (await api.v1.sketch.line({ id: skId, startPos: [10, 20, 0], endPos: [80, 60, 0] })).result
  console.log('[04] diagLine:', diagLine)

  // Horizontal line for comparison
  const horizLine = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [100, 0, 0] })).result

  // Vertical line for comparison
  const vertLine = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [0, 80, 0] })).result

  // Points
  const pt1 = (await api.v1.sketch.point({ id: skId, pos: [30, 10, 0] })).result
  const pt2 = (await api.v1.sketch.point({ id: skId, pos: [70, 50, 0] })).result

  // HORIZONTAL_DISTANCE on diagonal line
  const hd1 = await api.v1.sketch.dimension({ id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [diagLine], name: 'hd-diag' })
  console.log('[04] HD on diagonal:', hd1.result, 'maxLevel=', hd1.maxLevel)

  // VERTICAL_DISTANCE on diagonal line
  const vd1 = await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [diagLine], name: 'vd-diag' })
  console.log('[04] VD on diagonal:', vd1.result, 'maxLevel=', vd1.maxLevel)

  // HORIZONTAL_DISTANCE on horizontal line (should be full length)
  const hd2 = await api.v1.sketch.dimension({ id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [horizLine], name: 'hd-horiz' })
  console.log('[04] HD on horizontal:', hd2.result, 'maxLevel=', hd2.maxLevel)

  // VERTICAL_DISTANCE on vertical line
  const vd2 = await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [vertLine], name: 'vd-vert' })
  console.log('[04] VD on vertical:', vd2.result, 'maxLevel=', vd2.maxLevel)

  // HORIZONTAL_DISTANCE on vertical line — what happens?
  const hd3 = await api.v1.sketch.dimension({ id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [vertLine], name: 'hd-on-vert' })
  console.log('[04] HD on vertical line:', hd3.result, 'maxLevel=', hd3.maxLevel)

  // VERTICAL_DISTANCE on horizontal line — what happens?
  const vd3 = await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [horizLine], name: 'vd-on-horiz' })
  console.log('[04] VD on horizontal line:', vd3.result, 'maxLevel=', vd3.maxLevel)

  // HORIZONTAL_DISTANCE between 2 points
  const hd4 = await api.v1.sketch.dimension({ id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [pt1, pt2], name: 'hd-2pts' })
  console.log('[04] HD 2 points:', hd4.result, 'maxLevel=', hd4.maxLevel)

  // VERTICAL_DISTANCE between 2 points
  const vd4 = await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [pt1, pt2], name: 'vd-2pts' })
  console.log('[04] VD 2 points:', vd4.result, 'maxLevel=', vd4.maxLevel)

  // Extract structure members for all dims
  const dimIds = [hd1, hd2, hd3, hd4, vd1, vd2, vd3, vd4].filter(d => d.result).map(d => d.result)

  function findNodes(obj, ids) {
    const results = []
    if (!obj || typeof obj !== 'object') return results
    if (ids.includes(obj.id)) {
      results.push({ id: obj.id, name: obj.name, class: obj.class, members: obj.members })
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

  const nodes = findNodes(vd4.structure, dimIds)
  const summary = nodes.map(n => ({
    id: n.id,
    name: n.name,
    startPt: n.members?.startPt?.value,
    endPt: n.members?.endPt?.value,
    angle: n.members?.angle?.value,
    orientationType: n.members?.orientationType?.value,
  }))
  filewrite(summary, 'hd-vd-summary')

  await snapshot('hd-vd')
  return { partId }
}
