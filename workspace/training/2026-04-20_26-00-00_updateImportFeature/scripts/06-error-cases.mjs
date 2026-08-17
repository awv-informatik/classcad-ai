export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create a box, save, clear, reimport
  await api.v1.part.box({ id: partId, length: 50, width: 40, height: 30 })
  const boxStp = (await api.v1.common.save({ format: 'STP' })).result.content
  await api.v1.common.clear({})

  const partId2 = (await api.v1.part.create({ name: 'Target' })).result
  const importId = (await api.v1.part.importFeature({
    id: partId2,
    data: boxStp,
    format: 'STP',
    name: 'TestImport',
  })).result
  console.log('[06] importFeature result:', importId)

  // Test 1: Update with part ID instead of import ID (wrong ID type)
  await api.v1.part.openFeature({ id: importId })
  const r1 = await api.v1.part.updateImportFeature({
    id: partId2,
    data: boxStp,
    format: 'STP',
  })
  console.log('[06] wrong ID result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'wrong-id-response')

  // Test 2: Update with garbage data
  const r2 = await api.v1.part.updateImportFeature({
    id: importId,
    data: 'this-is-not-stp',
    format: 'STP',
  })
  console.log('[06] garbage data result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'garbage-data-response')

  // Test 3: Update with non-existent file path
  const r3 = await api.v1.part.updateImportFeature({
    id: importId,
    file: '/nonexistent/path/model.stp',
  })
  console.log('[06] bad file result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'bad-file-response')

  await api.v1.part.closeFeature({ id: importId })

  return { partId: partId2, importId }
}
