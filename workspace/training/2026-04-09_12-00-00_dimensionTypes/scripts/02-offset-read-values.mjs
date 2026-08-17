// Read back auto-calculated OFFSET dimension values from structure tree
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Rectangle 100x60 at origin
  const rect = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [100, 60, 0] })).result
  // lines: bottom(0-100,y=0), right(x=100,0-60), top(100-0,y=60), left(x=0,60-0)
  console.log('[02] rect lines:', rect)

  // Point at (30, 20)
  const pt1 = (await api.v1.sketch.point({ id: skId, pos: [30, 20, 0] })).result

  // Create dimensions with names for easy identification
  const cases = [
    { type: 'OFFSET', geomIds: [rect[0]], name: 'off-bottom' },        // 1 horizontal line
    { type: 'OFFSET', geomIds: [rect[1]], name: 'off-right' },         // 1 vertical line
    { type: 'OFFSET', geomIds: [rect[0], rect[2]], name: 'off-bot-top' }, // 2 parallel lines (60 apart)
    { type: 'OFFSET', geomIds: [rect[0], rect[1]], name: 'off-perp' }, // 2 perpendicular lines
    { type: 'OFFSET', geomIds: [rect[0], pt1], name: 'off-line-pt' }, // line + point
  ]

  const dimIds = []
  for (const c of cases) {
    const r = await api.v1.sketch.dimension({ id: skId, ...c })
    console.log(`[02] ${c.name}: id=${r.result} maxLevel=${r.maxLevel}`)
    dimIds.push(r.result)
  }

  // Get structure from last call
  const lastR = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rect[2]], name: 'off-top' })
  dimIds.push(lastR.result)
  console.log(`[02] off-top: id=${lastR.result} maxLevel=${lastR.maxLevel}`)

  // Dump structure - focus on dimension nodes
  const tree = lastR.structure
  function findNodes(obj, ids) {
    const results = []
    if (!obj || typeof obj !== 'object') return results
    if (ids.includes(obj.id)) {
      results.push(obj)
      return results // don't recurse
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

  const dimNodes = findNodes(tree, dimIds)
  filewrite(dimNodes, 'dim-nodes')

  // Also try getExpression on each dim to read value
  for (const id of dimIds) {
    if (!id) continue
    try {
      const expr = await api.v1.part.getExpression({ id })
      console.log(`[02] getExpression(${id}):`, expr.result, 'maxLevel=', expr.maxLevel)
    } catch (e) {
      console.log(`[02] getExpression(${id}) error:`, e.message)
    }
  }

  await snapshot('offsets')
  return { partId }
}
