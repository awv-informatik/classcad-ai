export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereTest' })).result

  const sphereId = (await api.v1.part.sphere({ id: partId, name: 'S1', radius: 40 })).result
  console.log('[08] sphereId:', sphereId)

  // Try updateSphere WITHOUT openFeature — should fail
  const ur = await api.v1.part.updateSphere({ id: sphereId, radius: 80 })
  console.log('[08] updateSphere without open:', ur.result, 'maxLevel:', ur.maxLevel)
  filewrite({ result: ur.result, messages: ur.messages, maxLevel: ur.maxLevel }, 'no-open-response')

  return { partId, sphereId }
}
