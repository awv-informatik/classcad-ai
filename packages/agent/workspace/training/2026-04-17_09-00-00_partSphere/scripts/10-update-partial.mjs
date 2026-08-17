export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereTest' })).result

  const sphereId = (await api.v1.part.sphere({ id: partId, name: 'S1', radius: 50 })).result
  console.log('[10] sphereId:', sphereId)

  // Partial update: only change name, radius should stay 50
  await api.v1.part.openFeature({ id: sphereId })
  const ur = await api.v1.part.updateSphere({ id: sphereId, name: 'RenamedOnly' })
  console.log('[10] partial update result:', ur.result, 'maxLevel:', ur.maxLevel)
  await api.v1.part.closeFeature({ id: sphereId })

  filewrite({ result: ur.result, messages: ur.messages, maxLevel: ur.maxLevel }, 'partial-response')
  // Dump structure to verify radius still 50
  filewrite((await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).structure, 'structure-after-partial')

  await snapshot('after-partial')
  return { partId, sphereId }
}
