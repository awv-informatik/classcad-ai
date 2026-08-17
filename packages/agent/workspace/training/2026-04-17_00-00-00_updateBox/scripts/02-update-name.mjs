export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'OriginalBox', length: 50, width: 50, height: 50 })).result
  console.log('[02] boxId:', boxId)

  // Get structure before rename to see feature name
  const structBefore = await api.v1.part.box({ id: partId, name: 'Dummy', length: 10, width: 10, height: 10 })
  // Actually, let's just use the structure from the creation call itself
  // Let me use a fresh approach - create, then check structure via common API

  // Open and update name only
  await api.v1.part.openFeature({ id: boxId })
  const upR = await api.v1.part.updateBox({ id: boxId, name: 'RenamedBox' })
  console.log('[02] updateBox(name) result:', upR.result, 'maxLevel:', upR.maxLevel)
  filewrite({ result: upR.result, messages: upR.messages, maxLevel: upR.maxLevel }, 'rename-response')
  await api.v1.part.closeFeature({ id: boxId })

  // Check the name via common.getObjectName
  const nameR = await api.v1.common.getObjectName({ id: boxId })
  console.log('[02] name after rename:', nameR.result)

  return { partId, boxId }
}
