export default async function (api, { snapshot, filewrite }) {
  // Test: rotation AND offset in a single moveUnderConstraints call
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 40, width: 30, height: 20 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Wcs', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Block1',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[11] COG before:', JSON.stringify(massBefore?.cog))
  await snapshot('before')

  // Test A: ROTATION mode + both rotation and offset params
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst],
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })
  const moveR = await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0, -1, 0], yDir: [1, 0, 0], zDir: [0, 0, 1] },
    offset: [50, 0, 0],
  })
  console.log('[11] move (ROTATION + both params):', moveR.result, 'maxLevel:', moveR.maxLevel)
  const massA = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[11] COG after ROTATION+offset:', JSON.stringify(massA?.cog))
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  await snapshot('rotation-plus-offset')

  // Compare: rotation only (reset first)
  await api.v1.assembly.transformInstanceTo({
    id: inst,
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst],
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0, -1, 0], yDir: [1, 0, 0], zDir: [0, 0, 1] },
  })
  const massRotOnly = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[11] COG rotation only:', JSON.stringify(massRotOnly?.cog))
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  // Compare: TRANSLATION_2D mode + offset only
  await api.v1.assembly.transformInstanceTo({
    id: inst,
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst],
    pivotInfo: [0, 0, 0],
    mucType: 'TRANSLATION_2D',
  })
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    offset: [50, 0, 0],
  })
  const massTransOnly = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[11] COG translation only:', JSON.stringify(massTransOnly?.cog))
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  filewrite({ massBefore, massA, massRotOnly, massTransOnly }, 'combined-comparison')

  return { asmId }
}
