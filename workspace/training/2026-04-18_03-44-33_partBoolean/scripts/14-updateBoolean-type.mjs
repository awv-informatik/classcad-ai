export default async function (api, { snapshot, filewrite }) {
  // Test updateBoolean: change the boolean type after creation
  const partId = (await api.v1.part.create({ name: 'UpdateType' })).result
  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 40 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Tool', length: 50, width: 40, height: 60, translation: [40, 15, -10] })).result

  // Create as UNION first
  const boolId = (await api.v1.part.boolean({
    id: partId,
    type: 'UNION',
    target: box1,
    tools: [box2],
  })).result

  console.log('[14] boolId:', boolId)
  await snapshot('union')

  // Update to SUBTRACTION via openFeature/updateBoolean/closeFeature
  await api.v1.part.openFeature({ id: boolId })
  const r = await api.v1.part.updateBoolean({
    id: boolId,
    type: 'SUBTRACTION',
  })
  await api.v1.part.closeFeature({ id: boolId })

  console.log('[14] updateBoolean type→SUB — result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'update-type-response')

  await snapshot('subtraction')

  // Update to INTERSECTION
  await api.v1.part.openFeature({ id: boolId })
  const r2 = await api.v1.part.updateBoolean({
    id: boolId,
    type: 'INTERSECTION',
  })
  await api.v1.part.closeFeature({ id: boolId })

  console.log('[14] updateBoolean type→INT — result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }, 'update-type-int')

  await snapshot('intersection')

  return { partId }
}
