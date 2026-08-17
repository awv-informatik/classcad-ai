// Test updateWorkPoint — change name only
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UWPTest' })).result

  const wpId = (await api.v1.part.workPoint({
    id: partId,
    name: 'OriginalName',
    position: [10, 20, 30]
  })).result
  console.log('[02] created wpId:', wpId, 'name: OriginalName')

  // Update name without openFeature
  const r1 = await api.v1.part.updateWorkPoint({
    id: wpId,
    name: 'RenamedPoint'
  })
  console.log('[02] rename without openFeature — result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Update name with openFeature
  await api.v1.part.openFeature({ id: wpId })
  const r2 = await api.v1.part.updateWorkPoint({
    id: wpId,
    name: 'RenamedAgain'
  })
  console.log('[02] rename with openFeature — result:', r2.result, 'maxLevel:', r2.maxLevel)
  await api.v1.part.closeFeature({ id: wpId })

  // Verify name via getWorkGeometry
  const gw = await api.v1.part.getWorkGeometry({ id: partId, name: 'RenamedAgain' })
  console.log('[02] getWorkGeometry RenamedAgain — result:', gw.result, 'maxLevel:', gw.maxLevel)

  const gwOld = await api.v1.part.getWorkGeometry({ id: partId, name: 'OriginalName' })
  console.log('[02] getWorkGeometry OriginalName (old) — result:', gwOld.result, 'maxLevel:', gwOld.maxLevel)

  filewrite({ withoutOpen: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, withOpen: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }, verifyNew: { result: gw.result, maxLevel: gw.maxLevel }, verifyOld: { result: gwOld.result, maxLevel: gwOld.maxLevel } }, 'name-update')

  return { partId }
}
