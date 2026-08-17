export default async function (api, { snapshot, filewrite }) {
  // Test: does getInstance (metadata query) lock instances?
  // Also test: does requestVisualisation lock instances?

  const asmId = (await api.v1.assembly.create({ name: 'GetInstLock' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  const boxId = (await api.v1.part.box({ id: tplId, name: 'Body', length: 60, width: 40, height: 10 })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1'
  })).result

  // Query via getInstance (metadata, not geometry)
  const gi = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[14] getInstance before:', JSON.stringify(gi.result))

  // Also call requestVisualisation (graphic data)
  const rv = await api.v1.common.requestVisualisation({ ids: [inst1] })
  console.log('[14] requestVisualisation maxLevel:', rv.maxLevel)

  // Modify template
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  await api.v1.part.openFeature({ id: boxId })
  await api.v1.part.updateBox({ id: boxId, height: 30 })
  await api.v1.part.closeFeature({ id: boxId })
  await api.v1.common.recalc({})

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const m1 = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  console.log('[14] inst1 volume AFTER (getInstance + requestVis before):', m1.result?.volume)

  // Expected: 72000 if these don't lock, 24000 if they do
  filewrite({ inst1VolAfter: m1.result?.volume }, 'getInstance-lock')
  return { asmId, tplId }
}
