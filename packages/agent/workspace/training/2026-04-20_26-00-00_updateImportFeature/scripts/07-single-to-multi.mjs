export default async function (api, { snapshot, filewrite }) {
  // Create single-body STP
  const p1 = (await api.v1.part.create({ name: 'S1' })).result
  await api.v1.part.box({ id: p1, length: 30, width: 30, height: 30 })
  const singleStp = (await api.v1.common.save({ format: 'STP' })).result.content
  await api.v1.common.clear({})

  // Create multi-body STP (3 bodies)
  const p2 = (await api.v1.part.create({ name: 'Multi' })).result
  await api.v1.part.box({ id: p2, length: 50, width: 40, height: 30 })
  await api.v1.part.cylinder({ id: p2, radius: 15, height: 40, position: [80, 0, 0] })
  await api.v1.part.cylinder({ id: p2, radius: 10, height: 25, position: [0, 60, 0] })
  const multiStp = (await api.v1.common.save({ format: 'STP' })).result.content
  await api.v1.common.clear({})

  // Import single-body
  const p3 = (await api.v1.part.create({ name: 'Target' })).result
  const importId = (await api.v1.part.importFeature({
    id: p3,
    data: singleStp,
    format: 'STP',
    name: 'TestImport',
  })).result
  console.log('[07] importFeature result:', importId)

  await api.v1.common.recalc({})
  const sb = JSON.stringify((await api.v1.common.recalc({})).structure).match(/CC_Solid/g)?.length || 0
  console.log('[07] solids before:', sb)
  await snapshot('before-single')

  // Update to multi-body, name-only update test: keep name by not passing it
  await api.v1.part.openFeature({ id: importId })
  const r = await api.v1.part.updateImportFeature({
    id: importId,
    data: multiStp,
    format: 'STP',
  })
  console.log('[07] updateImportFeature result:', r.result, 'maxLevel:', r.maxLevel)
  await api.v1.part.closeFeature({ id: importId })

  await api.v1.common.recalc({})
  const sa = JSON.stringify((await api.v1.common.recalc({})).structure).match(/CC_Solid/g)?.length || 0
  console.log('[07] solids after:', sa)
  await snapshot('after-multi')

  // Check if name was preserved (we didn't pass name in update)
  const struct = (await api.v1.common.recalc({})).structure
  filewrite(struct, 'structure-after')
  filewrite({ solidsBefore: sb, solidsAfter: sa }, 'solid-counts')

  return { partId: p3, importId }
}
