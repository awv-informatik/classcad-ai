export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VerifyCone' })).result
  console.log('[01] partId:', partId)

  // Create a reference box for visual comparison
  const refBox = (await api.v1.part.box({ id: partId, name: 'Ref', length: 20, width: 20, height: 20 })).result
  console.log('[01] refBox:', refBox)

  // Create cone with known dimensions
  const coneId = (await api.v1.part.cone({
    id: partId, name: 'TestCone',
    bDiameter: 60, tDiameter: 10, height: 80,
  })).result
  console.log('[01] coneId:', coneId)

  await snapshot('before')

  // Open, update, close
  const openR = await api.v1.part.openFeature({ id: coneId })
  console.log('[01] openFeature maxLevel:', openR.maxLevel)

  const upR = await api.v1.part.updateCone({ id: coneId, bDiameter: 100, tDiameter: 40, height: 150 })
  console.log('[01] updateCone result:', upR.result, 'maxLevel:', upR.maxLevel)
  filewrite({ result: upR.result, messages: upR.messages, maxLevel: upR.maxLevel }, 'update-response')

  const closeR = await api.v1.part.closeFeature({ id: coneId })
  console.log('[01] closeFeature maxLevel:', closeR.maxLevel)

  await snapshot('after')

  // Verify partial update — only change height
  await api.v1.part.openFeature({ id: coneId })
  const partialR = await api.v1.part.updateCone({ id: coneId, height: 50 })
  console.log('[01] partial updateCone result:', partialR.result, 'maxLevel:', partialR.maxLevel)
  await api.v1.part.closeFeature({ id: coneId })

  await snapshot('after-partial')

  return { partId, coneId }
}
