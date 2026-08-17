export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 80, width: 60, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm1' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 60, width: 15, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplC = (await api.v1.assembly.partTemplate({ name: 'Arm2' })).result
  await api.v1.part.box({ id: tplC, name: 'Box', length: 40, width: 12, height: 6 })
  const wcsC = (await api.v1.part.workCSys({ id: tplC, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const instBase = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const instArm1 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm1' })).result
  const instArm2 = (await api.v1.assembly.instance({ productId: tplC, ownerId: asmId, name: 'Arm2' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [instBase], csys: wcsA } })

  const rev1 = (await api.v1.assembly.revolute({
    id: asmId, name: 'Rev1',
    mate1: { path: [instBase], csys: wcsA },
    mate2: { path: [instArm1], csys: wcsB },
    zOffset: 15,
  })).result

  const rev2 = (await api.v1.assembly.revolute({
    id: asmId, name: 'Rev2',
    mate1: { path: [instBase], csys: wcsA },
    mate2: { path: [instArm2], csys: wcsC },
    zOffset: 25,
  })).result

  const gearId = (await api.v1.assembly.gear({
    id: asmId, name: 'MyGear',
    constr1Id: rev1, constr2Id: rev2,
    ratio: 2.5, offset: '30deg',
  })).result
  console.log('[05] gearId:', gearId)

  // Test getGear with assembly root ID
  const g1 = await api.v1.assembly.getGear({ id: asmId, name: 'MyGear' })
  console.log('[05] getGear result:', JSON.stringify(g1.result))
  console.log('[05] getGear maxLevel:', g1.maxLevel)

  // Test getGear with wrong name
  const g2 = await api.v1.assembly.getGear({ id: asmId, name: 'NonExistent' })
  console.log('[05] getGear wrong name:', JSON.stringify(g2.result), 'maxLevel:', g2.maxLevel)

  // Test getGear with instance ID (might fail like getRevolute)
  const g3 = await api.v1.assembly.getGear({ id: instBase, name: 'MyGear' })
  console.log('[05] getGear instId:', JSON.stringify(g3.result), 'maxLevel:', g3.maxLevel)

  // Test getGear with empty name
  const g4 = await api.v1.assembly.getGear({ id: asmId, name: '' })
  console.log('[05] getGear empty name:', JSON.stringify(g4.result), 'maxLevel:', g4.maxLevel)

  filewrite({
    found: { result: g1.result, maxLevel: g1.maxLevel, messages: g1.messages },
    wrongName: { result: g2.result, maxLevel: g2.maxLevel, messages: g2.messages },
    instId: { result: g3.result, maxLevel: g3.maxLevel, messages: g3.messages },
    emptyName: { result: g4.result, maxLevel: g4.maxLevel, messages: g4.messages },
  }, 'getGear-data')

  return { gearId }
}
