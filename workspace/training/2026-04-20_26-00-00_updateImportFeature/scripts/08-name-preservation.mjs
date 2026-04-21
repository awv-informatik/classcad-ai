export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create box STP
  await api.v1.part.box({ id: partId, length: 50, width: 40, height: 30 })
  const boxStp = (await api.v1.common.save({ format: 'STP' })).result.content
  await api.v1.common.clear({})

  // Create cylinder STP
  const p2 = (await api.v1.part.create({ name: 'Cyl' })).result
  await api.v1.part.cylinder({ id: p2, radius: 20, height: 50 })
  const cylStp = (await api.v1.common.save({ format: 'STP' })).result.content
  await api.v1.common.clear({})

  // Import box with specific name
  const p3 = (await api.v1.part.create({ name: 'Target' })).result
  const importId = (await api.v1.part.importFeature({
    id: p3,
    data: boxStp,
    format: 'STP',
    name: 'MyCustomName',
  })).result
  console.log('[08] importFeature result:', importId)

  // Check name before via structure
  const s1 = (await api.v1.common.recalc({})).structure
  const findName = (struct) => {
    const str = JSON.stringify(struct)
    const match = str.match(/"CC_Import"[^}]*"name":"([^"]+)"/)
    return match ? match[1] : 'not found'
  }
  console.log('[08] name before:', findName(s1))

  // Update data only, no name parameter
  await api.v1.part.openFeature({ id: importId })
  await api.v1.part.updateImportFeature({
    id: importId,
    data: cylStp,
    format: 'STP',
  })
  await api.v1.part.closeFeature({ id: importId })

  const s2 = (await api.v1.common.recalc({})).structure
  console.log('[08] name after data-only update:', findName(s2))

  // Now update with new name AND data
  await api.v1.part.openFeature({ id: importId })
  await api.v1.part.updateImportFeature({
    id: importId,
    data: boxStp,
    format: 'STP',
    name: 'UpdatedName',
  })
  await api.v1.part.closeFeature({ id: importId })

  const s3 = (await api.v1.common.recalc({})).structure
  console.log('[08] name after name+data update:', findName(s3))

  filewrite({
    nameBefore: findName(s1),
    nameAfterDataOnly: findName(s2),
    nameAfterNameAndData: findName(s3),
  }, 'name-results')

  return { partId: p3, importId }
}
