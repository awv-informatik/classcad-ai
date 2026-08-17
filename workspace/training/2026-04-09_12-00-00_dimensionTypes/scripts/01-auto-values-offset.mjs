// Test OFFSET auto-calculated values with different geometry combos
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create known geometry: rectangle 100x60
  const rect = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [100, 60, 0] })).result
  console.log('[01] rect IDs:', rect)

  // Also create 2 standalone points
  const pt1 = (await api.v1.sketch.point({ id: skId, pos: [20, 20, 0] })).result
  const pt2 = (await api.v1.sketch.point({ id: skId, pos: [80, 50, 0] })).result
  console.log('[01] pt1:', pt1, 'pt2:', pt2)

  // OFFSET on 1 line (bottom line of rect)
  const d1 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rect[0]], name: 'off-1line' })
  console.log('[01] OFFSET 1-line: id=', d1.result, 'maxLevel=', d1.maxLevel)

  // OFFSET on 2 parallel lines (top and bottom of rect)
  const d2 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rect[0], rect[2]], name: 'off-2lines' })
  console.log('[01] OFFSET 2-parallel: id=', d2.result, 'maxLevel=', d2.maxLevel)

  // OFFSET on 2 points
  const d3 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [pt1, pt2], name: 'off-2pts' })
  console.log('[01] OFFSET 2-points: id=', d3.result, 'maxLevel=', d3.maxLevel)

  // OFFSET on line+point
  const d4 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rect[0], pt1], name: 'off-line-pt' })
  console.log('[01] OFFSET line+pt: id=', d4.result, 'maxLevel=', d4.maxLevel)

  // OFFSET on 2 perpendicular lines (bottom and right side of rect)
  const d5 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rect[0], rect[1]], name: 'off-perp' })
  console.log('[01] OFFSET perp-lines: id=', d5.result, 'maxLevel=', d5.maxLevel)

  // Extract dimension values from structure
  const dimIds = [d1.result, d2.result, d3.result, d4.result, d5.result]
  const dimData = {}
  for (const id of dimIds) {
    if (!id) continue
    const nodes = (d1.structure || [])
    // Find dim node in structure
    const findNode = (tree, targetId) => {
      if (!tree) return null
      for (const node of (Array.isArray(tree) ? tree : [tree])) {
        if (node.id === targetId) return node
        if (node.children) {
          const found = findNode(node.children, targetId)
          if (found) return found
        }
      }
      return null
    }
  }

  // Use the last response's structure to find all dims
  filewrite(d5.structure, 'structure')

  await snapshot('offset-all')
  return { partId }
}
