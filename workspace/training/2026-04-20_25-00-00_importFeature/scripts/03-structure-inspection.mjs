export default async function (api, { snapshot, filewrite }) {
  // Create source geometry
  const srcPart = (await api.v1.part.create({ name: 'Source' })).result
  await api.v1.part.box({ id: srcPart, name: 'BoxA', length: 40, width: 30, height: 20 })
  await api.v1.part.cylinder({ id: srcPart, name: 'CylA', radius: 15, height: 35 })

  const saveResult = await api.v1.common.save({ format: 'STP' })

  // Clear and create target with existing geometry
  await api.v1.common.clear({})
  const tgtPart = (await api.v1.part.create({ name: 'Target' })).result
  const existingBox = (await api.v1.part.box({
    id: tgtPart, name: 'ExistingBox', length: 20, width: 20, height: 20,
  })).result

  // Import multi-body STP
  const r = await api.v1.part.importFeature({
    id: tgtPart,
    data: saveResult.result.content,
    format: 'STP',
    name: 'MultiBodyImport',
  })
  console.log('[03] importFeature result:', r.result, 'maxLevel:', r.maxLevel)

  // Dump structure tree to see what import created
  filewrite(r.structure, 'structure-after-import')
  await snapshot('multi-body-import')

  return { tgtPart, importId: r.result }
}
