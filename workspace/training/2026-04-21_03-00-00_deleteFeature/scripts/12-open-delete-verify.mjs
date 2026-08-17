export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 20, height: 60, position: [50, 0, 0] })).result
  console.log('[12] boxId:', boxId, 'cylId:', cylId)

  // Open box
  await api.v1.part.openFeature({ id: boxId })

  // Delete the cylinder (not the opened feature)
  const r1 = await api.v1.part.deleteFeature({ ids: [cylId] })
  console.log('[12] delete cyl while box open — maxLevel:', r1.maxLevel)

  // Close box — should work fine
  const close1 = await api.v1.part.closeFeature({ id: partId })
  console.log('[12] closeFeature after deleting other feature — maxLevel:', close1.maxLevel)

  // Verify state
  const cylCheck = await api.v1.part.getFeature({ id: partId, name: 'Cylinder' })
  const boxCheck = await api.v1.part.getFeature({ id: partId, name: 'Box' })
  console.log('[12] box:', boxCheck.result, 'cyl:', cylCheck.result)

  await snapshot('final-state')

  filewrite({
    deleteDuringOpen: { maxLevel: r1.maxLevel, messages: r1.messages },
    closeAfterDelete: { maxLevel: close1.maxLevel, messages: close1.messages },
    survivors: { box: boxCheck.result, cyl: cylCheck.result },
  }, 'open-delete-verify')

  return { partId }
}
