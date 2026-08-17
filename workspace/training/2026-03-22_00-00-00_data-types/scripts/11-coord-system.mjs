// Q: Right-hand coordinate system? How do rotation vectors work in solid.* APIs?
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // 1. Check default work planes — their normals tell us the coordinate system
  const r0 = await api.v1.common.getAppVersion({})

  // Work planes: Top(38), Front(42), Right(46)
  const top = r0.structure.tree['38']
  const front = r0.structure.tree['42']
  const right = r0.structure.tree['46']
  console.log('[11] Top plane members:', JSON.stringify(top.members))
  console.log('[11] Front plane members:', JSON.stringify(front.members))
  console.log('[11] Right plane members:', JSON.stringify(right.members))

  // 2. Create entity injection + solid.box with rotation to test rotation vector
  const eiId = (await api.v1.part.entityInjection({ id: partId })).result
  console.log('[11] entityInjection id:', eiId)

  // Create a solid box with no rotation
  const box1 = await api.v1.solid.box({
      id: eiId,
      xLen: 80,
      yLen: 20,
      zLen: 20
    })
  console.log('[11] solid.box:', box1.maxLevel <= 31 ? '✓' : '❌', 'solidId:', box1.result)

  await snapshot('box-no-rotation')

  // 3. solid.box with rotation vector [0, 0, PI/4] — rotate 45° around Z
  await api.v1.common.clear({})
  const partId2 = (await api.v1.part.create({ name: 'Test2' })).result
  const eiId2 = (await api.v1.part.entityInjection({ id: partId2 })).result

  const box2 = await api.v1.solid.box({
      id: eiId2,
      xLen: 80,
      yLen: 20,
      zLen: 20,
      rotation: [0, 0, Math.PI / 4]
    })
  console.log('[11] solid.box rotated Z=PI/4:', box2.maxLevel <= 31 ? '✓' : '❌')

  await snapshot('box-rotated-z45')

  // 4. rotation [PI/2, 0, 0] — rotate 90° around X
  await api.v1.common.clear({})
  const partId3 = (await api.v1.part.create({ name: 'Test3' })).result
  const eiId3 = (await api.v1.part.entityInjection({ id: partId3 })).result

  const box3 = await api.v1.solid.box({
      id: eiId3,
      xLen: 80,
      yLen: 20,
      zLen: 20,
      rotation: [Math.PI / 2, 0, 0]
    })
  console.log('[11] solid.box rotated X=PI/2:', box3.maxLevel <= 31 ? '✓' : '❌')

  await snapshot('box-rotated-x90')

  return {}
}
