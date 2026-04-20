export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConeRename' })).result

  const coneId = (await api.v1.part.cone({
    id: partId, name: 'OrigName', bDiameter: 50, tDiameter: 10, height: 80,
  })).result

  // Rename via updateCone
  await api.v1.part.openFeature({ id: coneId })
  const r = await api.v1.part.updateCone({ id: coneId, name: 'NewName' })
  await api.v1.part.closeFeature({ id: coneId })

  console.log('[12] rename result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'rename-response')
  filewrite(r.structure, 'rename-structure')

  return { partId, coneId }
}
