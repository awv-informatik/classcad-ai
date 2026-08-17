export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'BoxPart' })).result
  const boxFeat = (await api.v1.part.box({ id: tpl1, name: 'Box1', length: 40, width: 30, height: 20 })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BoxInst',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result

  const inst2 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BoxInst2',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result

  await snapshot('before')

  // Set current instance to inst1 — this should set current product to tpl1
  await api.v1.assembly.setCurrentInstance({ id: inst1 })

  // Now try to modify the template through part APIs
  // Open the box feature and update it
  const rOpen = await api.v1.part.openFeature({ id: boxFeat })
  console.log('[03] openFeature result:', rOpen.result, 'maxLevel:', rOpen.maxLevel)

  const rUpdate = await api.v1.part.updateBox({ id: boxFeat, height: 50 })
  console.log('[03] updateBox result:', rUpdate.result, 'maxLevel:', rUpdate.maxLevel)

  const rClose = await api.v1.part.closeFeature({ id: boxFeat })
  console.log('[03] closeFeature result:', rClose.result, 'maxLevel:', rClose.maxLevel)

  await api.v1.common.recalc({})

  // Switch back to assembly context
  await api.v1.assembly.setCurrentInstance({ id: asmId })

  await snapshot('after-update')

  // Verify: measure COG of both instances — should both reflect the height change
  const cog1 = (await api.v1.assembly.calculateMassProperties({ id: inst1 })).result
  const cog2 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[03] inst1 COG:', JSON.stringify(cog1))
  console.log('[03] inst2 COG:', JSON.stringify(cog2))

  filewrite({ cog1, cog2, boxFeat }, 'cog-after-update')

  return { asmId, tpl1, inst1, inst2 }
}
