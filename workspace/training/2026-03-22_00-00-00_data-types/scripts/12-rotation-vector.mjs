// Q: How do rotation vectors work? [rx, ry, rz] — Euler angles? Order?
// Also test the coordinate system (work plane normals already showed: Top=Z, Front=Y, Right=X)
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eiId = (await api.v1.part.entityInjection({ id: partId })).result

  // 1. Unrotated box — long in X
  const box1 = await api.v1.solid.box({
      id: eiId,
      length: 80,  // X
      width: 20,   // Y
      height: 20   // Z
    })
  console.log('[12] solid.box no rotation:', box1.maxLevel <= 31 ? '✓' : '❌', 'id:', box1.result)
  await snapshot('no-rotation')

  // 2. Rotated 45° around Z
  await api.v1.common.clear({})
  const partId2 = (await api.v1.part.create({ name: 'Test2' })).result
  const eiId2 = (await api.v1.part.entityInjection({ id: partId2 })).result

  const box2 = await api.v1.solid.box({
      id: eiId2,
      length: 80,
      width: 20,
      height: 20,
      rotation: [0, 0, Math.PI / 4]
    })
  console.log('[12] rotation [0,0,PI/4]:', box2.maxLevel <= 31 ? '✓' : '❌')
  await snapshot('rotated-z45')

  // 3. Rotated 90° around X (should swap Y/Z)
  await api.v1.common.clear({})
  const partId3 = (await api.v1.part.create({ name: 'Test3' })).result
  const eiId3 = (await api.v1.part.entityInjection({ id: partId3 })).result

  const box3 = await api.v1.solid.box({
      id: eiId3,
      length: 80,
      width: 20,
      height: 40,
      rotation: [Math.PI / 2, 0, 0]
    })
  console.log('[12] rotation [PI/2,0,0]:', box3.maxLevel <= 31 ? '✓' : '❌')
  await snapshot('rotated-x90')

  // 4. Combined rotation + translation
  await api.v1.common.clear({})
  const partId4 = (await api.v1.part.create({ name: 'Test4' })).result
  const eiId4 = (await api.v1.part.entityInjection({ id: partId4 })).result

  // Two boxes: one unrotated, one rotated and translated
  await api.v1.solid.box({
      id: eiId4,
      length: 60,
      width: 20,
      height: 20
    })
  const box4b = await api.v1.solid.box({
      id: eiId4,
      length: 60,
      width: 20,
      height: 20,
      rotation: [0, 0, Math.PI / 4],
      translation: [0, 50, 0]
    })
  console.log('[12] rotation+translation:', box4b.maxLevel <= 31 ? '✓' : '❌')
  await snapshot('two-boxes-rotation-translation')

  return {}
}
