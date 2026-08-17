// 09 — Rename entity injection with common.setObjectName
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RenameTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'Original' })).result
  console.log('[09] eifId:', eifId, 'original name: Original')

  // Try renaming with setObjectName
  const renameR = await api.v1.common.setObjectName({ id: eifId, name: 'Renamed' })
  console.log('[09] rename result:', renameR.result, 'maxLevel:', renameR.maxLevel)
  console.log('[09] rename messages:', JSON.stringify(renameR.messages))
  filewrite({ result: renameR.result, messages: renameR.messages, maxLevel: renameR.maxLevel }, 'rename-response')

  // Verify the new name in structure
  const eiNode = renameR.structure?.tree?.[eifId]
  console.log('[09] name after rename:', eiNode?.name)

  return { partId, eifId }
}
