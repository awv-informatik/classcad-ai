// Check ANGLEOX structure values for reversed lines and negative angles
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Normal 45° line
  const lineA = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 50, 0] })).result
  const dA = await api.v1.sketch.dimension({ id: skId, type: 'ANGLEOX', geomIds: [lineA], name: 'aox-45' })

  // Reversed 45° line (same geometric angle, reversed direction)
  const lineB = (await api.v1.sketch.line({ id: skId, startPos: [50, 80, 0], endPos: [0, 30, 0] })).result
  const dB = await api.v1.sketch.dimension({ id: skId, type: 'ANGLEOX', geomIds: [lineB], name: 'aox-45-rev' })

  // -45° line (going down)
  const lineC = (await api.v1.sketch.line({ id: skId, startPos: [0, 120, 0], endPos: [50, 70, 0] })).result
  const dC = await api.v1.sketch.dimension({ id: skId, type: 'ANGLEOX', geomIds: [lineC], name: 'aox-neg45' })

  // Reversed -45° line
  const lineD = (await api.v1.sketch.line({ id: skId, startPos: [50, 120, 0], endPos: [0, 170, 0] })).result
  const dD = await api.v1.sketch.dimension({ id: skId, type: 'ANGLEOX', geomIds: [lineD], name: 'aox-neg45-rev' })

  // Update one ANGLEOX dim and observe the value
  console.log('[10] dA:', dA.result, 'dB:', dB.result, 'dC:', dC.result, 'dD:', dD.result)

  // Try updateDimension to set ANGLEOX value in degrees
  const u1 = await api.v1.sketch.updateDimension({ id: dA.result, value: '30deg' })
  console.log('[10] updateDimension aox-45 to 30deg:', u1.result, 'maxLevel=', u1.maxLevel)

  // Get structure
  const dimIds = [dA.result, dB.result, dC.result, dD.result].filter(Boolean)
  function findNodes(obj, ids) {
    const results = []
    if (!obj || typeof obj !== 'object') return results
    if (ids.includes(obj.id)) {
      const m = obj.members || {}
      results.push({
        id: obj.id, name: obj.name,
        startPt: m.startPt?.value,
        endPt: m.endPt?.value,
        cornerPt: m.cornerPt?.value,
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

  const nodes = findNodes(u1.structure, dimIds)
  filewrite(nodes, 'angleox-reversed')
  console.log('[10] Nodes:', JSON.stringify(nodes, null, 2))

  return { partId }
}
