export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConeUpdate' })).result

  // Create a reference box so size changes are visible
  await api.v1.part.box({ id: partId, name: 'RefBox', length: 20, width: 20, height: 20 })

  const coneId = (await api.v1.part.cone({
    id: partId, name: 'UpdCone', bDiameter: 60, tDiameter: 10, height: 80,
  })).result

  await snapshot('before-update')

  // Update with open/close pattern
  await api.v1.part.openFeature({ id: coneId })
  const r = await api.v1.part.updateCone({ id: coneId, bDiameter: 100, tDiameter: 40, height: 150 })
  await api.v1.part.closeFeature({ id: coneId })

  console.log('[09] updateCone result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'update-basic-response')

  await snapshot('after-update')
  return { partId, coneId }
}
