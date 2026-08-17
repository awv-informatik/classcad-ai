export default async function (api, { snapshot, filewrite }) {
  await api.v1.common.clear({})
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'BoxA', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'CsysA', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'BoxB', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'CsysB', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm',
    transformation: [[80, 0, 15], [1, 0, 0], [0, 1, 0]],
  })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'G', mate1: { path: [inst1], csys: wcsA } })

  // Create revolute with no limits, no offset
  const revId = (await api.v1.assembly.revolute({
    id: asmId, name: 'Rev1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })).result
  console.log('[09] created revId:', revId)

  const mass2_0 = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[09] inst2 COG initial:', JSON.stringify(mass2_0?.cog))
  await snapshot('initial')

  // Update 1: add zOffset
  const u1 = await api.v1.assembly.updateRevolute({ id: revId, zOffset: 20 })
  console.log('[09] update zOffset=20:', u1.result, 'maxLevel:', u1.maxLevel)

  const mass2_1 = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[09] inst2 COG after zOffset=20:', JSON.stringify(mass2_1?.cog))
  await snapshot('zOffset-20')

  // Update 2: add rotation limits
  const u2 = await api.v1.assembly.updateRevolute({
    id: revId,
    zRotationLimits: { min: '0deg', max: '90deg' },
  })
  console.log('[09] update limits:', u2.result, 'maxLevel:', u2.maxLevel)

  const getR = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Rev1' })).result
  console.log('[09] state after updates:', JSON.stringify({
    zOffset: getR?.zOffset,
    limits: getR?.zRotationLimits,
    flip1: getR?.mate1?.flip,
    flip2: getR?.mate2?.flip,
  }))

  // Update 3: change flip on mate2
  const u3 = await api.v1.assembly.updateRevolute({
    id: revId,
    mate2: { flip: '-Z' },
  })
  console.log('[09] update mate2 flip=-Z:', u3.result, 'maxLevel:', u3.maxLevel)

  const mass2_3 = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[09] inst2 COG after flip=-Z:', JSON.stringify(mass2_3?.cog))
  await snapshot('flip-minusZ')

  // Update 4: rename
  const u4 = await api.v1.assembly.updateRevolute({ id: revId, name: 'Hinge_Renamed' })
  console.log('[09] rename:', u4.result, 'maxLevel:', u4.maxLevel)

  const getRenamed = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Hinge_Renamed' })).result
  const getOldName = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Rev1' })).result
  console.log('[09] found by new name:', getRenamed?.id === revId ? '✓' : '❌')
  console.log('[09] found by old name:', getOldName ? '❌ still findable' : '✓ not found')

  // Update 5: remove limits (set to VOID/null)
  const u5 = await api.v1.assembly.updateRevolute({
    id: revId,
    zRotationLimits: { min: null, max: null },
  })
  console.log('[09] remove limits:', u5.result, 'maxLevel:', u5.maxLevel)

  const getFinal = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Hinge_Renamed' })).result
  console.log('[09] final limits:', JSON.stringify(getFinal?.zRotationLimits))

  filewrite(getFinal, 'final-state')
  return { asmId }
}
