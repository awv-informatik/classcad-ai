// Test ANGLEOX: angle of line relative to X axis, range, direction
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Lines at various angles from origin
  const lines = []
  const angles = [0, 30, 45, 90, 135, 180, -45, -90]
  for (const deg of angles) {
    const rad = (deg * Math.PI) / 180
    const endX = 50 * Math.cos(rad)
    const endY = 50 * Math.sin(rad)
    // Offset each line so they don't overlap
    const offsetY = angles.indexOf(deg) * 15
    const r = await api.v1.sketch.line({
      id: skId,
      startPos: [0, offsetY, 0],
      endPos: [endX, offsetY + endY, 0],
    })
    lines.push({ deg, lineId: r.result })
    console.log(`[07] Line at ${deg}°: id=${r.result}`)
  }

  // Create ANGLEOX dimension on each line
  const dims = []
  for (const { deg, lineId } of lines) {
    const r = await api.v1.sketch.dimension({
      id: skId,
      type: 'ANGLEOX',
      geomIds: [lineId],
      name: `aox-${deg}`,
    })
    dims.push({ deg, dimId: r.result, maxLevel: r.maxLevel })
    console.log(`[07] ANGLEOX at ${deg}°: id=${r.result} maxLevel=${r.maxLevel}`)
  }

  // Extract structure values
  const dimIds = dims.map(d => d.dimId).filter(Boolean)
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

  const lastR = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [lines[0].lineId], name: 'dummy' })
  const nodes = findNodes(lastR.structure, dimIds)
  const summary = nodes.map(n => {
    const m = n.members || {}
    return {
      id: n.id,
      name: n.name,
      class: n.class,
      memberKeys: Object.keys(m).filter(k => !['_VERSION', 'master', 'flags'].includes(k)),
      ...Object.fromEntries(
        Object.keys(m)
          .filter(k => !['_VERSION', 'master', 'flags', 'displayInfo'].includes(k))
          .map(k => [k, m[k].value])
      ),
    }
  })
  filewrite(summary, 'angleox-summary')
  console.log('[07] Summary:', JSON.stringify(summary, null, 2))

  await snapshot('angleox')
  return { partId }
}
