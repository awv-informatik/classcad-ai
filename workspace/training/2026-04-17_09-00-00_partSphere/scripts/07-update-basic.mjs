export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereTest' })).result

  // Create a reference box so auto-scaling doesn't hide size changes
  await api.v1.part.box({ id: partId, name: 'Ref', length: 20, width: 20, height: 20 })

  const sphereId = (await api.v1.part.sphere({ id: partId, name: 'S1', radius: 40 })).result
  console.log('[07] sphereId:', sphereId)

  await snapshot('before-update')

  // filewrite structure before
  const structBefore = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' }))
  filewrite(structBefore.graphic, 'graphic-before')

  // Update radius with open/close
  await api.v1.part.openFeature({ id: sphereId })
  const ur = await api.v1.part.updateSphere({ id: sphereId, radius: 80 })
  console.log('[07] updateSphere result:', ur.result, 'maxLevel:', ur.maxLevel)
  await api.v1.part.closeFeature({ id: sphereId })

  filewrite({ result: ur.result, messages: ur.messages, maxLevel: ur.maxLevel }, 'update-response')

  await snapshot('after-update')
  return { partId, sphereId }
}
