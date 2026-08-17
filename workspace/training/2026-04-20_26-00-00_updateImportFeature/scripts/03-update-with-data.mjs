export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create a box, save as STP
  await api.v1.part.box({ id: partId, length: 50, width: 40, height: 30 })
  const boxStp = (await api.v1.common.save({ format: 'STP' })).result.content
  console.log('[03] box STP length:', boxStp.length)

  await api.v1.common.clear({})

  // Create a cylinder, save as STP
  const partId2 = (await api.v1.part.create({ name: 'Cyl' })).result
  await api.v1.part.cylinder({ id: partId2, radius: 20, height: 60 })
  const cylStp = (await api.v1.common.save({ format: 'STP' })).result.content
  console.log('[03] cylinder STP length:', cylStp.length)

  await api.v1.common.clear({})

  // Create target part and import the box
  const partId3 = (await api.v1.part.create({ name: 'Target' })).result
  const importId = (await api.v1.part.importFeature({
    id: partId3,
    data: boxStp,
    format: 'STP',
    name: 'BoxImport',
  })).result
  console.log('[03] importFeature result:', importId)

  await api.v1.common.recalc({})
  await snapshot('before-update')

  // Count solids before
  const structBefore = (await api.v1.common.recalc({})).structure
  filewrite(structBefore, 'structure-before')

  // Open feature, update with cylinder data
  const openR = await api.v1.part.openFeature({ id: importId })
  console.log('[03] openFeature result:', openR.result, 'maxLevel:', openR.maxLevel)

  const r = await api.v1.part.updateImportFeature({
    id: importId,
    data: cylStp,
    format: 'STP',
    name: 'CylinderImport',
  })
  console.log('[03] updateImportFeature result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'update-response')

  // Close feature
  const closeR = await api.v1.part.closeFeature({ id: importId })
  console.log('[03] closeFeature result:', closeR.result, 'maxLevel:', closeR.maxLevel)

  await api.v1.common.recalc({})
  await snapshot('after-update')

  // Check structure after
  const structAfter = (await api.v1.common.recalc({})).structure
  filewrite(structAfter, 'structure-after')

  return { partId: partId3, importId }
}
