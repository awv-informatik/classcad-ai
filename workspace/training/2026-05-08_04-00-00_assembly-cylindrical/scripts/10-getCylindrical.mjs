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

  // Create cylindrical
  const cylId = (await api.v1.assembly.cylindrical({
    id: asmId, name: 'Cyl1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffsetLimits: { min: 10, max: 30 },
    zRotationLimits: { min: '-45deg', max: '90deg' }
  })).result

  // Test 1: get by assembly root ID (should work)
  const r1 = await api.v1.assembly.getCylindrical({ id: asmId, name: 'Cyl1' })
  console.log('[10] by asmId:', r1.result ? 'found' : 'NOT FOUND', 'maxLevel:', r1.maxLevel)
  filewrite(r1.result, 'getCylindrical-full')

  // Test 2: by instance ID (docs say "product or instance" — check if it works)
  const r2 = await api.v1.assembly.getCylindrical({ id: inst1, name: 'Cyl1' })
  console.log('[10] by inst1 ID:', r2.result ? 'found' : 'NOT FOUND', 'maxLevel:', r2.maxLevel)

  const r3 = await api.v1.assembly.getCylindrical({ id: inst2, name: 'Cyl1' })
  console.log('[10] by inst2 ID:', r3.result ? 'found' : 'NOT FOUND', 'maxLevel:', r3.maxLevel)

  // Test 3: by template ID
  const r4 = await api.v1.assembly.getCylindrical({ id: tplA, name: 'Cyl1' })
  console.log('[10] by template ID:', r4.result ? 'found' : 'NOT FOUND', 'maxLevel:', r4.maxLevel)

  // Test 4: non-existent name
  const r5 = await api.v1.assembly.getCylindrical({ id: asmId, name: 'Nope' })
  console.log('[10] non-existent name:', r5.result, 'maxLevel:', r5.maxLevel)

  // Test 5: empty name
  const r6 = await api.v1.assembly.getCylindrical({ id: asmId, name: '' })
  console.log('[10] empty name:', r6.result, 'maxLevel:', r6.maxLevel)

  // Test 6: wrong constraint type (query a fastenedOrigin as cylindrical)
  const r7 = await api.v1.assembly.getCylindrical({ id: asmId, name: 'Ground' })
  console.log('[10] wrong type (fastenedOrigin):', r7.result ? 'found' : 'NOT FOUND', 'maxLevel:', r7.maxLevel)

  // Test 7: batch query
  const r8 = await api.v1.assembly.getCylindrical([
    { id: asmId, name: 'Cyl1' },
    { id: asmId, name: 'Nope' }
  ])
  console.log('[10] batch: results count:', Array.isArray(r8.result) ? r8.result.length : 'not array')
  console.log('[10] batch result[0]:', r8.result?.[0] ? 'found' : 'null')
  console.log('[10] batch result[1]:', r8.result?.[1] ? 'found' : 'null')
  console.log('[10] batch maxLevel:', r8.maxLevel)

  return { asmId }
}
