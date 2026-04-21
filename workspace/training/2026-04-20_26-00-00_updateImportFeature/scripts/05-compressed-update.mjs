export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create box, save as compressed STP
  await api.v1.part.box({ id: partId, length: 50, width: 40, height: 30 })
  const boxStp = (await api.v1.common.save({
    format: 'STP', compression: 'deflate', encoding: 'base64',
  })).result.content
  console.log('[05] box compressed STP length:', boxStp.length)

  await api.v1.common.clear({})

  // Create cylinder, save as compressed STP
  const partId2 = (await api.v1.part.create({ name: 'Cyl' })).result
  await api.v1.part.cylinder({ id: partId2, radius: 25, height: 50 })
  const cylStp = (await api.v1.common.save({
    format: 'STP', compression: 'deflate', encoding: 'base64',
  })).result.content
  console.log('[05] cyl compressed STP length:', cylStp.length)

  await api.v1.common.clear({})

  // Import box with compression
  const partId3 = (await api.v1.part.create({ name: 'Target' })).result
  const importId = (await api.v1.part.importFeature({
    id: partId3,
    data: boxStp,
    format: 'STP',
    compression: 'deflate',
    encoding: 'base64',
    name: 'CompressedImport',
  })).result
  console.log('[05] importFeature result:', importId)

  await api.v1.common.recalc({})
  await snapshot('before-compressed-update')

  // Update with compressed cylinder data
  await api.v1.part.openFeature({ id: importId })
  const r = await api.v1.part.updateImportFeature({
    id: importId,
    data: cylStp,
    format: 'STP',
    compression: 'deflate',
    encoding: 'base64',
  })
  console.log('[05] updateImportFeature result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'update-response')
  await api.v1.part.closeFeature({ id: importId })

  await api.v1.common.recalc({})
  await snapshot('after-compressed-update')

  return { partId: partId3, importId }
}
