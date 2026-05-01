export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GearAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'W1' })).result
  await api.v1.part.cylinder({ id: tpl1, name: 'C', height: 10, diameter: 40 })
  const wcs1 = (await api.v1.part.workCSys({ id: tpl1, name: 'A', origin: [0,0,5], xDirection: [1,0,0], yDirection: [0,1,0] })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'W2' })).result
  await api.v1.part.cylinder({ id: tpl2, name: 'C', height: 10, diameter: 20 })
  const wcs2 = (await api.v1.part.workCSys({ id: tpl2, name: 'A', origin: [0,0,5], xDirection: [1,0,0], yDirection: [0,1,0] })).result

  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'W3' })).result
  await api.v1.part.cylinder({ id: tpl3, name: 'C', height: 10, diameter: 30 })
  const wcs3 = (await api.v1.part.workCSys({ id: tpl3, name: 'A', origin: [0,0,5], xDirection: [1,0,0], yDirection: [0,1,0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'I2', transformation: [[30,0,0],[1,0,0],[0,1,0]] })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl3, ownerId: asmId, name: 'I3', transformation: [[-35,0,0],[1,0,0],[0,1,0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })
  const rev1 = (await api.v1.assembly.revolute({ id: asmId, name: 'R1', mate1: { path: [inst1], csys: wcs1 }, mate2: { path: [inst2], csys: wcs2 } })).result
  const rev2 = (await api.v1.assembly.revolute({ id: asmId, name: 'R2', mate1: { path: [inst1], csys: wcs1 }, mate2: { path: [inst3], csys: wcs3 } })).result

  const gearId = (await api.v1.assembly.gear({ id: asmId, name: 'TestGear', constr1Id: rev1, constr2Id: rev2, ratio: 2 })).result

  // 1. Not-found name
  const notFound = await api.v1.assembly.getGear({ id: asmId, name: 'NonexistentGear' })
  console.log('[08] not-found — result:', notFound.result, 'maxLevel:', notFound.maxLevel)
  if (notFound.messages?.length) console.log('[08] not-found msg:', notFound.messages[0].message, 'code:', notFound.messages[0].code)

  // 2. Use instance ID instead of assembly ID
  const byInst = await api.v1.assembly.getGear({ id: inst1, name: 'TestGear' })
  console.log('[08] getGear with instance ID — result:', byInst.result != null ? 'found' : 'null', 'maxLevel:', byInst.maxLevel)

  // 3. Batch getGear — array param
  const batchGet = await api.v1.assembly.getGear([
    { id: asmId, name: 'TestGear' },
    { id: asmId, name: 'NonexistentGear' },
  ])
  console.log('[08] batch getGear result:', JSON.stringify(batchGet.result))
  console.log('[08] batch getGear maxLevel:', batchGet.maxLevel)

  // 4. Case sensitivity
  const caseLookup = await api.v1.assembly.getGear({ id: asmId, name: 'testgear' })
  console.log('[08] case sensitivity — result:', caseLookup.result, 'maxLevel:', caseLookup.maxLevel)

  // 5. Empty name
  const emptyName = await api.v1.assembly.getGear({ id: asmId, name: '' })
  console.log('[08] empty name — result:', emptyName.result, 'maxLevel:', emptyName.maxLevel)

  filewrite({
    notFound: { result: notFound.result, messages: notFound.messages, maxLevel: notFound.maxLevel },
    byInst: { result: byInst.result, maxLevel: byInst.maxLevel },
    batchGet: { result: batchGet.result, maxLevel: batchGet.maxLevel },
    caseLookup: { result: caseLookup.result, maxLevel: caseLookup.maxLevel },
    emptyName: { result: emptyName.result, maxLevel: emptyName.maxLevel },
  }, 'getGear-edge-cases')

  return { gearId }
}
