// Test RADIUS and DIAMETER auto-calculated values, verify 2x relationship
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Circle with radius 35
  const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [50, 50, 0], radius: 35 })).result
  console.log('[05] circle:', circle)

  // Arc by center (radius = 30)
  const arc = (await api.v1.sketch.arcByCenter({
    id: skId,
    centerPos: [-50, 50, 0],
    startPos: [-50, 80, 0],
    endPos: [-80, 50, 0]
  })).result
  console.log('[05] arc:', arc)

  // RADIUS on circle
  const rd1 = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [circle], name: 'rad-circle' })
  console.log('[05] RADIUS on circle:', rd1.result, 'maxLevel=', rd1.maxLevel)

  // DIAMETER on circle
  const dd1 = await api.v1.sketch.dimension({ id: skId, type: 'DIAMETER', geomIds: [circle], name: 'dia-circle' })
  console.log('[05] DIAMETER on circle:', dd1.result, 'maxLevel=', dd1.maxLevel)

  // RADIUS on arc
  const rd2 = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [arc], name: 'rad-arc' })
  console.log('[05] RADIUS on arc:', rd2.result, 'maxLevel=', rd2.maxLevel)

  // DIAMETER on arc
  const dd2 = await api.v1.sketch.dimension({ id: skId, type: 'DIAMETER', geomIds: [arc], name: 'dia-arc' })
  console.log('[05] DIAMETER on arc:', dd2.result, 'maxLevel=', dd2.maxLevel)

  // Extract dimension values from structure
  const dimIds = [rd1.result, dd1.result, rd2.result, dd2.result].filter(Boolean)
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

  const nodes = findNodes(dd2.structure, dimIds)
  const summary = nodes.map(n => ({
    id: n.id,
    name: n.name,
    class: n.class,
    value: n.members?.value?.value,
    radius: n.members?.radius?.value,
    center: n.members?.center?.value,
    paramName: n.members?.paramName?.value,
  }))
  filewrite(summary, 'radius-diameter-summary')
  console.log('[05] Summary:', JSON.stringify(summary))

  await snapshot('radius-diameter')
  return { partId }
}
