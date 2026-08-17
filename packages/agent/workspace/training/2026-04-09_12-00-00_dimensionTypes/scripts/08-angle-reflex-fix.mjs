// Fix reflex test: try boolean true instead of string 'TRUE'
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Two lines: horizontal and 60° angle
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [100, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 86.6, 0] })).result // ~60°

  // Normal angle (acute sector)
  const a1 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [line1, line2], name: 'normal' })
  console.log('[08] normal angle:', a1.result, 'maxLevel=', a1.maxLevel)

  // Try reflex with boolean true
  const a2 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [line1, line2], reflex: true, name: 'reflex-bool' })
  console.log('[08] reflex (bool true):', a2.result, 'maxLevel=', a2.maxLevel)

  // Try reflex with string 'TRUE'
  const a3 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [line1, line2], reflex: 'TRUE', name: 'reflex-str' })
  console.log('[08] reflex (str TRUE):', a3.result, 'maxLevel=', a3.maxLevel)
  if (a3.messages) console.log('[08] reflex str messages:', JSON.stringify(a3.messages))

  // Try with dimPos to select different sectors
  // Sector below x-axis, on the obtuse side
  const a4 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [line1, line2], dimPos: [-30, -20, 0], name: 'sector-below' })
  console.log('[08] sector below:', a4.result, 'maxLevel=', a4.maxLevel)

  // Extract structure for angle dimensions
  const dimIds = [a1.result, a2.result, a3.result, a4.result].filter(Boolean)
  function findNodes(obj, ids) {
    const results = []
    if (!obj || typeof obj !== 'object') return results
    if (ids.includes(obj.id)) {
      const m = obj.members || {}
      results.push({
        id: obj.id, name: obj.name,
        sector: m.sector?.value,
        ccw: m.ccw?.value,
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

  const lastR = a4.result ? a4 : (a3.result ? a3 : a2)
  const nodes = findNodes(lastR.structure, dimIds)
  filewrite(nodes, 'reflex-summary')
  console.log('[08] Nodes:', JSON.stringify(nodes))

  await snapshot('angle-reflex')
  return { partId }
}
