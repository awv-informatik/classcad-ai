export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create a box, save as STP, clear, reimport
  await api.v1.part.box({ id: partId, length: 50, width: 40, height: 30 })
  const stpData = (await api.v1.common.save({ format: 'STP' })).result.content
  await api.v1.common.clear({})

  const partId2 = (await api.v1.part.create({ name: 'Target' })).result
  const importId = (await api.v1.part.importFeature({
    id: partId2,
    data: stpData,
    format: 'STP',
    name: 'OriginalName',
  })).result
  console.log('[01] importFeature result:', importId)

  await api.v1.common.recalc({})
  await snapshot('before-rename')

  // Now update: rename only, no new data
  const r = await api.v1.part.updateImportFeature({
    id: importId,
    name: 'RenamedImport',
  })
  console.log('[01] updateImportFeature result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'rename-response')

  await api.v1.common.recalc({})
  await snapshot('after-rename')

  // Check structure to see if name changed
  const structR = await api.v1.common.recalc({})
  filewrite(structR.structure, 'structure-after-rename')

  return { partId: partId2, importId }
}
