// Test ANGLE dimension: sector selection with dimPos, reflex
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Two lines forming a 45° angle from origin
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [100, 0, 0] })).result // horizontal
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [70, 70, 0] })).result // 45° line
  console.log('[06] line1:', line1, 'line2:', line2)

  // ANGLE auto-calculated (no dimPos, no reflex)
  const a1 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [line1, line2], name: 'angle-auto' })
  console.log('[06] ANGLE auto:', a1.result, 'maxLevel=', a1.maxLevel)

  // ANGLE with dimPos in the acute sector (between the lines, above x-axis)
  const a2 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [line1, line2], dimPos: [50, 20, 0], name: 'angle-acute' })
  console.log('[06] ANGLE acute dimPos:', a2.result, 'maxLevel=', a2.maxLevel)

  // ANGLE with dimPos in the obtuse sector (below x-axis)
  const a3 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [line1, line2], dimPos: [50, -20, 0], name: 'angle-obtuse' })
  console.log('[06] ANGLE obtuse dimPos:', a3.result, 'maxLevel=', a3.maxLevel)

  // ANGLE with reflex=TRUE
  const a4 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [line1, line2], reflex: 'TRUE', name: 'angle-reflex' })
  console.log('[06] ANGLE reflex:', a4.result, 'maxLevel=', a4.maxLevel)

  // Extract structure for angle dims
  const dimIds = [a1.result, a2.result, a3.result, a4.result].filter(Boolean)
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

  const nodes = findNodes(a4.structure, dimIds)
  const summary = nodes.map(n => {
    const m = n.members || {}
    return {
      id: n.id,
      name: n.name,
      class: n.class,
      // Check all member keys
      memberKeys: Object.keys(m).filter(k => !['_VERSION', 'master', 'flags'].includes(k)),
      // Extract relevant values
      ...Object.fromEntries(
        Object.keys(m)
          .filter(k => !['_VERSION', 'master', 'flags'].includes(k))
          .map(k => [k, m[k].value])
      ),
    }
  })
  filewrite(summary, 'angle-sectors')
  console.log('[06] Summary:', JSON.stringify(summary, null, 2))

  await snapshot('angle-sectors')
  return { partId }
}
