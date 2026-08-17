export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create box, save STP inline + save to file
  await api.v1.part.box({ id: partId, length: 50, width: 40, height: 30 })
  const boxStp = (await api.v1.common.save({ format: 'STP' })).result.content
  await api.v1.common.clear({})

  // Create cylinder, save to file
  const p2 = (await api.v1.part.create({ name: 'CylFile' })).result
  await api.v1.part.cylinder({ id: p2, radius: 25, height: 45 })
  const cylSaveR = await api.v1.common.save({ format: 'STP', file: '/tmp/cc-test-update-import.stp' })
  console.log('[12] cylinder save result:', cylSaveR.result?.success, 'maxLevel:', cylSaveR.maxLevel)
  await api.v1.common.clear({})

  // Import box via data
  const p3 = (await api.v1.part.create({ name: 'Target' })).result
  const importId = (await api.v1.part.importFeature({
    id: p3,
    data: boxStp,
    format: 'STP',
    name: 'BoxImport',
  })).result
  console.log('[12] importFeature result:', importId)

  await api.v1.common.recalc({})
  await snapshot('before-file-update')

  // Update with file
  await api.v1.part.openFeature({ id: importId })
  const r = await api.v1.part.updateImportFeature({
    id: importId,
    file: '/tmp/cc-test-update-import.stp',
  })
  console.log('[12] file update result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'file-update-response')
  await api.v1.part.closeFeature({ id: importId })

  await api.v1.common.recalc({})
  await snapshot('after-file-update')

  return { partId: p3 }
}
