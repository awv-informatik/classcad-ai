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

  const getName = async () => {
    const s = (await api.v1.common.recalc({})).structure
    return s.tree?.[importId]?.name || s.tree?.[String(importId)]?.name
  }

  console.log('[10] name before:', await getName())

  // Update data only, no name
  await api.v1.part.openFeature({ id: importId })
  await api.v1.part.updateImportFeature({
    id: importId,
    data: cylStp,
    format: 'STP',
  })
  await api.v1.part.closeFeature({ id: importId })
  console.log('[10] name after data-only update:', await getName())

  // Update with name + data
  await api.v1.part.openFeature({ id: importId })
  await api.v1.part.updateImportFeature({
    id: importId,
    data: boxStp,
    format: 'STP',
    name: 'NewName',
  })
  await api.v1.part.closeFeature({ id: importId })
  console.log('[10] name after name+data update:', await getName())

  // Update with name only (data still required — expect error)
  await api.v1.part.openFeature({ id: importId })
  const r4 = await api.v1.part.updateImportFeature({
    id: importId,
    name: 'OnlyName',
  })
  console.log('[10] name-only update result:', r4.result, 'maxLevel:', r4.maxLevel)
  await api.v1.part.closeFeature({ id: importId })
  console.log('[10] name after name-only attempt:', await getName())

  return { partId: p3 }
}
