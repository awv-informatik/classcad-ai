// 03 — Update name of a work plane
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const wpId = (await api.v1.part.workPlane({ id: partId, name: 'OldName' })).result
  console.log('[03] created wpId:', wpId)

  // Verify old name
  const g1 = await api.v1.part.getWorkGeometry({ id: partId, name: 'OldName' })
  console.log('[03] lookup "OldName":', g1.result)

  // Open → rename → close
  await api.v1.part.openFeature({ id: wpId })
  const r = await api.v1.part.updateWorkPlane({ id: wpId, name: 'NewName' })
  console.log('[03] rename result:', r.result, 'maxLevel:', r.maxLevel)
  await api.v1.part.closeFeature({ id: wpId })

  // Verify new name
  const g2 = await api.v1.part.getWorkGeometry({ id: partId, name: 'NewName' })
  console.log('[03] lookup "NewName":', g2.result)

  // Verify old name no longer works
  const g3 = await api.v1.part.getWorkGeometry({ id: partId, name: 'OldName' })
  console.log('[03] lookup "OldName" after rename:', g3.result, 'maxLevel:', g3.maxLevel)

  return { partId, wpId }
}
