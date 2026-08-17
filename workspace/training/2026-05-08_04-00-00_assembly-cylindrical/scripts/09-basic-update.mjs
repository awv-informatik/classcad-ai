export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm',
    transformation: [[0, 0, 20], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  // Create cylindrical with no limits
  const cylId = (await api.v1.assembly.cylindrical({
    id: asmId, name: 'Cyl1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB }
  })).result
  console.log('[09] created:', cylId)

  const cogBefore = (await api.v1.part.calculateMassProperties({ id: inst2 })).result?.cog
  console.log('[09] COG before update:', cogBefore)

  // Update: add zOffsetLimits
  const u1 = await api.v1.assembly.updateCylindrical({
    id: cylId,
    zOffsetLimits: { min: 30, max: 50 }
  })
  console.log('[09] update zOffsetLimits:', u1.result, 'maxLevel:', u1.maxLevel)
  if (u1.messages?.length) u1.messages.forEach(m => console.log('[09]   msg:', m.message))

  const cogAfterOffset = (await api.v1.part.calculateMassProperties({ id: inst2 })).result?.cog
  console.log('[09] COG after zOffsetLimits update:', cogAfterOffset)

  // Update: add zRotationLimits
  const u2 = await api.v1.assembly.updateCylindrical({
    id: cylId,
    zRotationLimits: { min: '-90deg', max: '90deg' }
  })
  console.log('[09] update zRotationLimits:', u2.result, 'maxLevel:', u2.maxLevel)

  // Update: rename
  const u3 = await api.v1.assembly.updateCylindrical({
    id: cylId,
    name: 'Hinge'
  })
  console.log('[09] rename:', u3.result, 'maxLevel:', u3.maxLevel)

  // Read back under new name
  const getR = await api.v1.assembly.getCylindrical({ id: asmId, name: 'Hinge' })
  console.log('[09] getCylindrical under new name:', getR.result ? 'found' : 'NOT FOUND')
  filewrite(getR.result, 'getCylindrical-afterUpdate')

  // Old name should not work
  const getOld = await api.v1.assembly.getCylindrical({ id: asmId, name: 'Cyl1' })
  console.log('[09] getCylindrical old name:', getOld.result ? 'found' : 'NOT FOUND', 'maxLevel:', getOld.maxLevel)

  // Update: remove limits (null)
  const u4 = await api.v1.assembly.updateCylindrical({
    id: cylId,
    zOffsetLimits: { min: null, max: null },
    zRotationLimits: { min: null, max: null }
  })
  console.log('[09] remove limits:', u4.result, 'maxLevel:', u4.maxLevel)

  const getR2 = await api.v1.assembly.getCylindrical({ id: asmId, name: 'Hinge' })
  console.log('[09] after removing limits:', getR2.result?.zOffsetLimits, getR2.result?.zRotationLimits)

  // Error: pass assembly ID instead of constraint ID
  const u5 = await api.v1.assembly.updateCylindrical({ id: asmId, name: 'Test' })
  console.log('[09] wrong id type:', u5.result, 'maxLevel:', u5.maxLevel)
  if (u5.messages?.length) u5.messages.forEach(m => console.log('[09]   msg:', m.code, m.message))

  await snapshot('after-updates')

  return { asmId }
}
