export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereTest' })).result

  // Reference box
  await api.v1.part.box({ id: partId, name: 'Ref', length: 20, width: 20, height: 20 })

  const wcsId = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [80, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  // Create sphere at origin
  const sphereId = (await api.v1.part.sphere({ id: partId, name: 'S1', radius: 30 })).result
  console.log('[09] sphereId:', sphereId)

  await snapshot('before-move')

  // Update: add references (move to WCS) + rename
  await api.v1.part.openFeature({ id: sphereId })
  const ur1 = await api.v1.part.updateSphere({ id: sphereId, name: 'MovedSphere', references: [wcsId] })
  console.log('[09] update with refs:', ur1.result, 'maxLevel:', ur1.maxLevel)
  await api.v1.part.closeFeature({ id: sphereId })

  filewrite({ result: ur1.result, messages: ur1.messages, maxLevel: ur1.maxLevel }, 'add-refs-response')
  await snapshot('after-move')

  // Update: remove references (back to origin)
  await api.v1.part.openFeature({ id: sphereId })
  const ur2 = await api.v1.part.updateSphere({ id: sphereId, references: [] })
  console.log('[09] remove refs:', ur2.result, 'maxLevel:', ur2.maxLevel)
  await api.v1.part.closeFeature({ id: sphereId })

  filewrite({ result: ur2.result, messages: ur2.messages, maxLevel: ur2.maxLevel }, 'remove-refs-response')
  await snapshot('after-remove-refs')

  return { partId, sphereId }
}
