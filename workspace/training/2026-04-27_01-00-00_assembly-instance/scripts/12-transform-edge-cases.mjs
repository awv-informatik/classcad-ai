export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TransEdge' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Cube' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 10, width: 10, height: 10 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Non-orthogonal matrix (docs say must be orthogonal)
  const rNonOrtho = await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'NonOrtho',
    transformation: [
      [1, 0.5, 0, 0],
      [0, 1, 0, 50],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })
  console.log('[12] non-orthogonal matrix:', rNonOrtho.result, 'maxLevel:', rNonOrtho.maxLevel)
  if (rNonOrtho.messages?.length) console.log('[12]   msg:', rNonOrtho.messages[0].message)

  // Matrix with scaling (docs say scaling ignored)
  const rScaled = await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Scaled',
    transformation: [
      [2, 0, 0, 0],
      [0, 2, 0, 100],
      [0, 0, 2, 0],
      [0, 0, 0, 1],
    ],
  })
  console.log('[12] scaled matrix:', rScaled.result, 'maxLevel:', rScaled.maxLevel)
  if (rScaled.messages?.length) console.log('[12]   msg:', rScaled.messages[0].message)

  // If scaled succeeded, check mass properties to see if scale was ignored
  if (rScaled.result) {
    const mass = (await api.v1.assembly.calculateMassProperties({ id: rScaled.result })).result
    console.log('[12] scaled mass volume:', mass.volume, '(expected 1000 if scale ignored)')
    console.log('[12] scaled mass cog:', mass.cog)
    filewrite(mass, 'scaled-mass')
  }

  // 3-point with non-unit direction vectors
  const rNonUnit = await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'NonUnit',
    transformation: [[0, 150, 0], [5, 0, 0], [0, 5, 0]],
  })
  console.log('[12] non-unit direction vectors:', rNonUnit.result, 'maxLevel:', rNonUnit.maxLevel)
  if (rNonUnit.messages?.length) console.log('[12]   msg:', rNonUnit.messages[0].message)

  // Left-handed system (docs say not supported)
  const rLeftHand = await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'LeftHand',
    transformation: [
      [-1, 0, 0, 0],
      [0, 1, 0, 200],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })
  console.log('[12] left-handed (mirror X):', rLeftHand.result, 'maxLevel:', rLeftHand.maxLevel)
  if (rLeftHand.messages?.length) console.log('[12]   msg:', rLeftHand.messages[0].message)

  filewrite({
    nonOrtho: { result: rNonOrtho.result, maxLevel: rNonOrtho.maxLevel, msg: rNonOrtho.messages?.[0]?.message },
    scaled: { result: rScaled.result, maxLevel: rScaled.maxLevel, msg: rScaled.messages?.[0]?.message },
    nonUnit: { result: rNonUnit.result, maxLevel: rNonUnit.maxLevel, msg: rNonUnit.messages?.[0]?.message },
    leftHand: { result: rLeftHand.result, maxLevel: rLeftHand.maxLevel, msg: rLeftHand.messages?.[0]?.message },
  }, 'edge-cases')

  return { asmId }
}
