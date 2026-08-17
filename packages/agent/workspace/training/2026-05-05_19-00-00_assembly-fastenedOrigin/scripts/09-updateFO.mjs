export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'M', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Upd',
  })).result

  // Create with offset
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Upd',
    mate1: { path: [inst], csys: wcs },
    xOffset: 50,
  })).result
  console.log('[09] created foId:', foId)

  // Verify initial position
  const mass1 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[09] COG initial:', JSON.stringify(mass1?.cog))

  // Update offset
  const upR = await api.v1.assembly.updateFastenedOrigin({
    id: foId, xOffset: 100, yOffset: 30,
  })
  console.log('[09] update result:', upR.result, 'maxLevel:', upR.maxLevel)

  const mass2 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[09] COG after update:', JSON.stringify(mass2?.cog))

  // Verify partial update: yOffset=30, but zOffset should remain 0
  const state = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Upd' })).result
  console.log('[09] state after update:', JSON.stringify(state))
  filewrite(state, 'update-state')

  // Update rotation
  const upR2 = await api.v1.assembly.updateFastenedOrigin({
    id: foId, zRotation: '90deg',
  })
  console.log('[09] rotation update:', upR2.result, 'maxLevel:', upR2.maxLevel)

  const mass3 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[09] COG after rotation:', JSON.stringify(mass3?.cog))

  // Update name
  const upR3 = await api.v1.assembly.updateFastenedOrigin({
    id: foId, name: 'RenamedFO',
  })
  console.log('[09] rename result:', upR3.result, 'maxLevel:', upR3.maxLevel)

  // Old name should be gone
  const oldQ = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Upd' })).result
  const newQ = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'RenamedFO' })).result
  console.log('[09] old name query:', oldQ, 'new name query:', newQ?.name)

  // Update with useCurrentTransform — should back-compute and lock current position
  const upR4 = await api.v1.assembly.updateFastenedOrigin({
    id: foId, useCurrentTransform: 1,
  })
  console.log('[09] useCurrentTransform update:', upR4.result, 'maxLevel:', upR4.maxLevel)
  const stateUCT = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'RenamedFO' })).result
  console.log('[09] state after UCT:', JSON.stringify(stateUCT))
  filewrite(stateUCT, 'update-uct-state')

  // Zero out everything
  const upR5 = await api.v1.assembly.updateFastenedOrigin({
    id: foId, xOffset: 0, yOffset: 0, zOffset: 0,
    xRotation: 0, yRotation: 0, zRotation: 0,
  })
  const mass4 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[09] COG after zero:', JSON.stringify(mass4?.cog))

  filewrite({
    cogInitial: mass1?.cog,
    cogAfterOffset: mass2?.cog,
    cogAfterRotation: mass3?.cog,
    cogAfterZero: mass4?.cog,
  }, 'update-cog-progression')

  return {}
}
