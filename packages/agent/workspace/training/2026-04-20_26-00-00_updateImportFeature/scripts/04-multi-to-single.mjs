export default async function (api, { snapshot, filewrite }) {
  // Create multi-body STP (box + cylinder)
  const partId = (await api.v1.part.create({ name: 'Multi' })).result
  await api.v1.part.box({ id: partId, length: 50, width: 40, height: 30 })
  await api.v1.part.cylinder({ id: partId, radius: 15, height: 40, position: [80, 0, 0] })
  const multiStp = (await api.v1.common.save({ format: 'STP' })).result.content
  console.log('[04] multi-body STP length:', multiStp.length)

  await api.v1.common.clear({})

  // Create single-body STP (just a small box)
  const partId2 = (await api.v1.part.create({ name: 'Single' })).result
  await api.v1.part.box({ id: partId2, length: 20, width: 20, height: 20 })
  const singleStp = (await api.v1.common.save({ format: 'STP' })).result.content
  console.log('[04] single-body STP length:', singleStp.length)

  await api.v1.common.clear({})

  // Import multi-body
  const partId3 = (await api.v1.part.create({ name: 'Target' })).result
  const importId = (await api.v1.part.importFeature({
    id: partId3,
    data: multiStp,
    format: 'STP',
    name: 'MultiBody',
  })).result
  console.log('[04] importFeature result:', importId)

  await api.v1.common.recalc({})
  await snapshot('before-multi')

  // Count solids before
  const structBefore = (await api.v1.common.recalc({})).structure
  const solidsBefore = JSON.stringify(structBefore).match(/CC_Solid/g)?.length || 0
  console.log('[04] solids before:', solidsBefore)

  // Update to single-body STP
  await api.v1.part.openFeature({ id: importId })
  const r = await api.v1.part.updateImportFeature({
    id: importId,
    data: singleStp,
    format: 'STP',
  })
  console.log('[04] updateImportFeature result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'update-response')
  await api.v1.part.closeFeature({ id: importId })

  await api.v1.common.recalc({})
  await snapshot('after-single')

  const structAfter = (await api.v1.common.recalc({})).structure
  const solidsAfter = JSON.stringify(structAfter).match(/CC_Solid/g)?.length || 0
  console.log('[04] solids after:', solidsAfter)
  filewrite({ solidsBefore, solidsAfter }, 'solid-counts')

  return { partId: partId3, importId }
}
