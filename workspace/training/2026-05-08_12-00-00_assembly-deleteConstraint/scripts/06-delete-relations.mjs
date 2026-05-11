export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  // Two templates with different shapes
  const tplA = (await api.v1.assembly.partTemplate({ name: 'GearA' })).result
  await api.v1.part.box({ id: tplA, name: 'B', length: 40, width: 30, height: 20 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'GearB' })).result
  await api.v1.part.box({ id: tplB, name: 'B', length: 30, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Inst1' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Inst2',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst3 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Inst3',
    transformation: [[0, 60, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Ground inst1
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA },
  })

  // Revolute joints for gear
  const rev1 = (await api.v1.assembly.revolute({
    id: asmId, name: 'Rev1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 0,
  })).result
  const rev2 = (await api.v1.assembly.revolute({
    id: asmId, name: 'Rev2',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst3], csys: wcsA },
    zOffset: 0,
  })).result

  // Create a gear relation
  const gearId = (await api.v1.assembly.gear({
    id: asmId, name: 'GearRel',
    constraint1: rev1,
    constraint2: rev2,
    ratio: 2.0,
  })).result
  console.log('[06] gearId:', gearId)

  // Create a group relation
  const groupId = (await api.v1.assembly.group({
    id: asmId, name: 'GroupRel',
    constraint1: rev1,
    constraint2: rev2,
  })).result
  console.log('[06] groupId:', groupId)

  // Delete the gear relation
  const delGear = await api.v1.assembly.deleteConstraint({ ids: [gearId] })
  console.log('[06] delete gear - result:', delGear.result, 'maxLevel:', delGear.maxLevel)
  filewrite({ test: 'delete-gear', result: delGear.result, messages: delGear.messages, maxLevel: delGear.maxLevel }, 'delete-gear')

  // Verify gear is gone
  const getGear = await api.v1.assembly.getGear({ id: asmId, name: 'GearRel' })
  console.log('[06] getGear after delete:', getGear.result, 'maxLevel:', getGear.maxLevel)

  // Delete the group relation
  const delGroup = await api.v1.assembly.deleteConstraint({ ids: [groupId] })
  console.log('[06] delete group - result:', delGroup.result, 'maxLevel:', delGroup.maxLevel)
  filewrite({ test: 'delete-group', result: delGroup.result, messages: delGroup.messages, maxLevel: delGroup.maxLevel }, 'delete-group')

  // Verify group is gone
  const getGroup = await api.v1.assembly.getGroup({ id: asmId, name: 'GroupRel' })
  console.log('[06] getGroup after delete:', getGroup.result, 'maxLevel:', getGroup.maxLevel)

  // Verify the underlying revolute constraints are NOT deleted
  const getRev1 = await api.v1.assembly.getRevolute({ id: asmId, name: 'Rev1' })
  const getRev2 = await api.v1.assembly.getRevolute({ id: asmId, name: 'Rev2' })
  console.log('[06] Rev1 still exists?', getRev1.result !== null)
  console.log('[06] Rev2 still exists?', getRev2.result !== null)

  return { asmId }
}
