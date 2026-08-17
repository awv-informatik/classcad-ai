export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'A' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'B',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst3 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'C',
    transformation: [[0, 60, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcs },
  })).result

  const f1 = (await api.v1.assembly.fastened({
    id: asmId, name: 'Joint1',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    xOffset: 80,
  })).result

  const f2 = (await api.v1.assembly.fastened({
    id: asmId, name: 'Joint2',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst3], csys: wcs },
    yOffset: 60,
  })).result

  console.log('[05] foId:', foId, 'f1:', f1, 'f2:', f2)

  // Test 1: Atomicity — valid constraint + invalid ID
  // Put VALID first, then INVALID — if atomic, neither should be deleted
  const r1 = await api.v1.assembly.deleteConstraint({ ids: [f1, 99999] })
  console.log('[05] atomicity test - result:', r1.result, 'maxLevel:', r1.maxLevel)
  const checkF1 = await api.v1.assembly.getFastened({ id: asmId, name: 'Joint1' })
  console.log('[05] Joint1 still exists?', checkF1.result !== null, 'maxLevel:', checkF1.maxLevel)
  filewrite({ test: 'atomicity', deleteResult: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, joint1Exists: checkF1.result !== null }, 'atomicity')

  // Test 2: Delete fastenedOrigin (grounding constraint)
  const cogBefore = (await api.v1.assembly.calculateMassProperties({ id: inst1 })).result
  console.log('[05] inst1 COG before grounding delete:', JSON.stringify(cogBefore?.cog))

  await snapshot('before-ground-delete')

  const delGround = await api.v1.assembly.deleteConstraint({ ids: [foId] })
  console.log('[05] delete fastenedOrigin - result:', delGround.result, 'maxLevel:', delGround.maxLevel)

  const cogAfter = (await api.v1.assembly.calculateMassProperties({ id: inst1 })).result
  console.log('[05] inst1 COG after grounding delete:', JSON.stringify(cogAfter?.cog))

  await snapshot('after-ground-delete')

  filewrite({
    cogBefore: cogBefore?.cog,
    cogAfter: cogAfter?.cog,
    deleteResult: { result: delGround.result, messages: delGround.messages, maxLevel: delGround.maxLevel },
  }, 'grounding-delete')

  return { asmId }
}
