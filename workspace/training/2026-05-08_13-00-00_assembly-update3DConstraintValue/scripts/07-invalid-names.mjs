// Test update3DConstraintValue with invalid names, invalid IDs, and undocumented names
export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'A' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'B',
    transformation: [[0, 0, 30], [1, 0, 0], [0, 1, 0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcs } })

  const revId = (await api.v1.assembly.revolute({
    id: asmId, name: 'Rev',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    zOffset: 30,
  })).result

  // Test 1: invalid name string
  const r1 = await api.v1.assembly.update3DConstraintValue({ id: revId, name: 'INVALID', value: 10 })
  console.log('[07] INVALID name:', r1.result, 'maxLevel:', r1.maxLevel, 'msgs:', JSON.stringify(r1.messages))

  // Test 2: X_ROTATION (not in the documented list)
  const r2 = await api.v1.assembly.update3DConstraintValue({ id: revId, name: 'X_ROTATION', value: 0.5 })
  console.log('[07] X_ROTATION:', r2.result, 'maxLevel:', r2.maxLevel, 'msgs:', JSON.stringify(r2.messages))

  // Test 3: Y_ROTATION (not in the documented list)
  const r3 = await api.v1.assembly.update3DConstraintValue({ id: revId, name: 'Y_ROTATION', value: 0.5 })
  console.log('[07] Y_ROTATION:', r3.result, 'maxLevel:', r3.maxLevel, 'msgs:', JSON.stringify(r3.messages))

  // Test 4: empty name
  const r4 = await api.v1.assembly.update3DConstraintValue({ id: revId, name: '', value: 10 })
  console.log('[07] empty name:', r4.result, 'maxLevel:', r4.maxLevel, 'msgs:', JSON.stringify(r4.messages))

  // Test 5: lowercase (case sensitivity)
  const r5 = await api.v1.assembly.update3DConstraintValue({ id: revId, name: 'z_rotation', value: 0.5 })
  console.log('[07] lowercase z_rotation:', r5.result, 'maxLevel:', r5.maxLevel, 'msgs:', JSON.stringify(r5.messages))

  // Test 6: invalid constraint ID (assembly root ID)
  const r6 = await api.v1.assembly.update3DConstraintValue({ id: asmId, name: 'Z_ROTATION', value: 0.5 })
  console.log('[07] assembly root ID:', r6.result, 'maxLevel:', r6.maxLevel, 'msgs:', JSON.stringify(r6.messages))

  // Test 7: invalid constraint ID (instance ID)
  const r7 = await api.v1.assembly.update3DConstraintValue({ id: inst1, name: 'Z_ROTATION', value: 0.5 })
  console.log('[07] instance ID:', r7.result, 'maxLevel:', r7.maxLevel, 'msgs:', JSON.stringify(r7.messages))

  // Test 8: non-existent ID
  const r8 = await api.v1.assembly.update3DConstraintValue({ id: 999999, name: 'Z_ROTATION', value: 0.5 })
  console.log('[07] non-existent ID:', r8.result, 'maxLevel:', r8.maxLevel, 'msgs:', JSON.stringify(r8.messages))

  filewrite({
    invalidName: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    xRotation: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    yRotation: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    emptyName: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
    lowercase: { result: r5.result, maxLevel: r5.maxLevel, messages: r5.messages },
    asmRootId: { result: r6.result, maxLevel: r6.maxLevel, messages: r6.messages },
    instanceId: { result: r7.result, maxLevel: r7.maxLevel, messages: r7.messages },
    nonExistent: { result: r8.result, maxLevel: r8.maxLevel, messages: r8.messages },
  }, 'error-results')

  return { revId }
}
