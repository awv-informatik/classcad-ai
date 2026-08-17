// 24 — Debug: examine the full structure tree for curve shapes — check geometryIdList objects
export default async function (api, { snapshot, filewrite }) {
  await api.v1.common.setDatabaseSettings({ doCurveTessellation: true })

  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // Create multiple curves
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  await api.v1.curve.arcByCenter({
    id: shapeId, centerPos: [50, 15, 0], startPos: [50, 0, 0], endPos: [65, 15, 0], isClockwise: false,
  })
  await api.v1.curve.line({ id: shapeId, startPos: [65, 15, 0], endPos: [65, 40, 0] })
  const lastR = await api.v1.curve.circle({ id: shapeId, centerPos: [30, 20, 0], radius: 8 })

  // Dump the structure tree, focusing on the shape and its geometry
  const tree = lastR.structure?.tree || {}

  // Find the curve entity and its children
  const curveEntity = tree[String(shapeId)]
  console.log('[24] CC_CurveEntity:', JSON.stringify(curveEntity, null, 2).substring(0, 500))

  // Check geometryIdList objects
  if (curveEntity?.geometryIdList) {
    for (const geoId of curveEntity.geometryIdList) {
      const geo = tree[String(geoId)]
      if (geo) {
        console.log(`[24] geo ${geoId}:`, JSON.stringify(geo, null, 2).substring(0, 500))
      } else {
        console.log(`[24] geo ${geoId}: NOT in tree`)
      }
    }
  }

  // Also check children
  if (curveEntity?.children) {
    for (const childId of curveEntity.children) {
      const child = tree[String(childId)]
      console.log(`[24] child ${childId}: class=${child?.class} name=${child?.name}`)
      if (child?.members) {
        const memberKeys = Object.keys(child.members)
        console.log(`  members: ${memberKeys.join(', ')}`)
        for (const key of memberKeys) {
          const m = child.members[key]
          if (m.type === 'point' || key.includes('Pos') || key.includes('center') || key.includes('radius')) {
            console.log(`  ${key}: ${JSON.stringify(m.value)}`)
          }
        }
      }
    }
  }

  // Dump a summary of ALL tree objects
  console.log('[24] === All tree objects ===')
  for (const [id, obj] of Object.entries(tree)) {
    if (obj.parent === shapeId || obj.parent === Number(shapeId)) {
      console.log(`  ${id}: class=${obj.class} name=${obj.name}`)
      if (obj.members) {
        for (const [k, v] of Object.entries(obj.members)) {
          if (v.value !== undefined && k !== '_VERSION') {
            console.log(`    ${k}: ${JSON.stringify(v.value)}`)
          }
        }
      }
    }
  }

  filewrite(tree, 'tree')
  return { partId }
}
