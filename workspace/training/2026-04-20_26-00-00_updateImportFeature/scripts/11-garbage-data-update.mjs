export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create box STP
  await api.v1.part.box({ id: partId, length: 50, width: 40, height: 30 })
  const boxStp = (await api.v1.common.save({ format: 'STP' })).result.content
  await api.v1.common.clear({})

  // Import box
  const p2 = (await api.v1.part.create({ name: 'Target' })).result
  const importId = (await api.v1.part.importFeature({
    id: p2,
    data: boxStp,
    format: 'STP',
    name: 'ValidImport',
  })).result
  console.log('[11] importFeature result:', importId)

  await api.v1.common.recalc({})
  await snapshot('before-garbage')

  // Count solids before
  const s1 = (await api.v1.common.recalc({})).structure
  const solidsBefore = s1.tree?.['4']?.solids?.length || Object.values(s1.tree).filter(n => n.class === 'CC_Solid').length
  console.log('[11] solids before:', solidsBefore)

  // Update with garbage data
  await api.v1.part.openFeature({ id: importId })
  const r = await api.v1.part.updateImportFeature({
    id: importId,
    data: 'this-is-not-valid-stp',
    format: 'STP',
  })
  console.log('[11] garbage update result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'garbage-response')
  await api.v1.part.closeFeature({ id: importId })

  await api.v1.common.recalc({})
  await snapshot('after-garbage')

  // Count solids after — did the old geometry survive?
  const s2 = (await api.v1.common.recalc({})).structure
  const solidsAfter = Object.values(s2.tree).filter(n => n.class === 'CC_Solid').length
  console.log('[11] solids after:', solidsAfter)
  filewrite({ solidsBefore, solidsAfter }, 'solid-counts')

  return { partId: p2 }
}
