export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'B', length: 80, width: 60, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm1' })).result
  await api.v1.part.box({ id: tplB, name: 'B', length: 60, width: 15, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplC = (await api.v1.assembly.partTemplate({ name: 'Arm2' })).result
  await api.v1.part.box({ id: tplC, name: 'B', length: 40, width: 12, height: 6 })
  const wcsC = (await api.v1.part.workCSys({ id: tplC, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm1' })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tplC, ownerId: asmId, name: 'Arm2' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  const rev1 = (await api.v1.assembly.revolute({
    id: asmId, name: 'Rev1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 10,
  })).result

  const rev2 = (await api.v1.assembly.revolute({
    id: asmId, name: 'Rev2',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst3], csys: wcsC },
    zOffset: 20,
  })).result

  console.log('[07] rev1:', rev1, 'rev2:', rev2)

  // Create gear (correct param names)
  const gearId = (await api.v1.assembly.gear({
    id: asmId, name: 'GearRel',
    constr1Id: rev1, constr2Id: rev2,
    ratio: 2.0,
  })).result
  console.log('[07] gearId:', gearId)

  // Verify gear exists
  const getGearBefore = await api.v1.assembly.getGear({ id: asmId, name: 'GearRel' })
  console.log('[07] gear exists before:', getGearBefore.result !== null)

  // Delete gear relation
  const delGear = await api.v1.assembly.deleteConstraint({ ids: [gearId] })
  console.log('[07] delete gear - result:', delGear.result, 'maxLevel:', delGear.maxLevel)
  filewrite({ result: delGear.result, messages: delGear.messages, maxLevel: delGear.maxLevel }, 'delete-gear')

  // Verify gear is gone
  const getGearAfter = await api.v1.assembly.getGear({ id: asmId, name: 'GearRel' })
  console.log('[07] gear exists after:', getGearAfter.result !== null, 'maxLevel:', getGearAfter.maxLevel)

  // Revolute constraints still exist?
  const getRev1 = await api.v1.assembly.getRevolute({ id: asmId, name: 'Rev1' })
  const getRev2 = await api.v1.assembly.getRevolute({ id: asmId, name: 'Rev2' })
  console.log('[07] Rev1 still exists?', getRev1.result !== null)
  console.log('[07] Rev2 still exists?', getRev2.result !== null)

  // Now create a group and delete it
  const groupId = (await api.v1.assembly.group({
    id: asmId, name: 'GroupRel',
    constraint1: rev1, constraint2: rev2,
  })).result
  console.log('[07] groupId:', groupId)

  if (groupId) {
    const delGroup = await api.v1.assembly.deleteConstraint({ ids: [groupId] })
    console.log('[07] delete group - result:', delGroup.result, 'maxLevel:', delGroup.maxLevel)
    filewrite({ result: delGroup.result, messages: delGroup.messages, maxLevel: delGroup.maxLevel }, 'delete-group')

    const getGroupAfter = await api.v1.assembly.getGroup({ id: asmId, name: 'GroupRel' })
    console.log('[07] group exists after:', getGroupAfter.result !== null)
  } else {
    console.log('[07] group creation failed, checking group params...')
  }

  return { asmId }
}
