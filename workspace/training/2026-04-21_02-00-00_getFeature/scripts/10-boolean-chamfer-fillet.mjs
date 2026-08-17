export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result

  // Create two boxes for boolean
  const box1 = (await api.v1.part.box({ id: partId, name: 'MainBox', length: 80, width: 80, height: 80 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'ToolBox', length: 40, width: 40, height: 40 })).result

  // Boolean subtraction
  const boolId = (await api.v1.part.boolean({
    id: partId,
    name: 'MyBool',
    type: 'SUBTRACTION',
    target: box1,
    tools: [box2],
  })).result
  console.log('[10] boolId:', boolId)

  const rBool = await api.v1.part.getFeature({ id: partId, name: 'MyBool' })
  console.log('[10] "MyBool":', rBool.result, 'match:', rBool.result === boolId)

  // Create a chamfer
  const geoIds = (await api.v1.part.getGeometryIds({ id: partId })).result
  console.log('[10] geoIds count:', geoIds ? geoIds.length : 0)

  // Try a chamfer if we have edge IDs
  if (geoIds && geoIds.length > 0) {
    const chamferId = (await api.v1.part.chamfer({
      id: partId,
      name: 'MyChamfer',
      edges: [geoIds[0]],
      distance: 5,
    })).result
    console.log('[10] chamferId:', chamferId)

    const rChamfer = await api.v1.part.getFeature({ id: partId, name: 'MyChamfer' })
    console.log('[10] "MyChamfer":', rChamfer.result, 'match:', rChamfer.result === chamferId)
  }

  // Check that consumed tool features are still findable
  const rTool = await api.v1.part.getFeature({ id: partId, name: 'ToolBox' })
  console.log('[10] "ToolBox" (consumed):', rTool.result, 'match:', rTool.result === box2)

  filewrite({
    boolLookup: { result: rBool.result, maxLevel: rBool.maxLevel },
    toolLookup: { result: rTool.result, maxLevel: rTool.maxLevel },
  }, 'boolean-chamfer')

  return { partId }
}
