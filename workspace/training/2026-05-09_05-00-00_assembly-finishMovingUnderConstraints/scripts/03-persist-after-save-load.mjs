export default async function (api, { snapshot, filewrite }) {
  // Setup: assembly with unconstrained instance
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 40, width: 30, height: 20 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Free',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Move instance to a specific position
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
  })
  await api.v1.assembly.moveUnderConstraints({ id: asmId, offset: [75, 40, 25] })
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  const massBeforeSave = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[03] COG before save:', massBeforeSave.cog)
  await snapshot('before-save')

  // Save to OFB
  const saveRes = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result
  console.log('[03] saved OFB:', saveRes.content?.length, 'chars')

  // Clear and reload
  await api.v1.common.clear({})
  const loadRes = (await api.v1.common.load({ data: saveRes.content, format: 'OFB', encoding: 'base64' })).result
  console.log('[03] loaded, root:', loadRes.id)

  // The IDs change after load — need to find the instance again
  // Use calculateMassProperties on the new root to check overall assembly position
  const massAfterLoad = (await api.v1.assembly.calculateMassProperties({ id: loadRes.id })).result
  console.log('[03] assembly COG after load:', massAfterLoad.cog)
  await snapshot('after-load')

  filewrite({
    cogBeforeSave: massBeforeSave.cog,
    cogAfterLoad: massAfterLoad.cog,
    savedDataLength: saveRes.content?.length,
    loadedRootId: loadRes.id,
  }, 'persist-result')

  return { }
}
