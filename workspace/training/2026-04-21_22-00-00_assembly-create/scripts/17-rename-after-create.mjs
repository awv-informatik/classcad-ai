export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Original' })).result
  console.log('[17] created:', asmId)

  // Rename with setObjectName
  const renameR = await api.v1.common.setObjectName({ id: asmId, name: 'Renamed' })
  console.log('[17] rename result:', renameR.result, 'maxLevel:', renameR.maxLevel)

  // Verify rename took effect — check structure
  const root = renameR.structure?.tree?.[asmId]
  console.log('[17] name after rename:', root?.name)
  console.log('[17] originalName after rename:', root?.members?.originalName?.value)

  filewrite({ asmId, renameResult: renameR.result, maxLevel: renameR.maxLevel, nameAfter: root?.name, originalNameAfter: root?.members?.originalName?.value }, 'rename')
  return { asmId }
}
