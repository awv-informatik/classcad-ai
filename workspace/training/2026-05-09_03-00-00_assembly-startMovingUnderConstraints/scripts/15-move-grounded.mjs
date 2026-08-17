export default async function (api, { snapshot, filewrite }) {
  // Test: attempt to move a grounded (fastenedOrigin) instance
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 50, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Wcs', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'GroundedBlock',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Ground the instance
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst], csys: wcsA },
  })

  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[15] COG before:', JSON.stringify(massBefore?.cog))

  // Try to move the grounded instance
  const startR = await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst],
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })
  console.log('[15] start:', startR.result, 'maxLevel:', startR.maxLevel)

  const moveR = await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0, -1, 0], yDir: [1, 0, 0], zDir: [0, 0, 1] },
  })
  console.log('[15] move:', moveR.result, 'maxLevel:', moveR.maxLevel)
  filewrite({ result: moveR.result, messages: moveR.messages, maxLevel: moveR.maxLevel }, 'move-grounded')

  const massAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[15] COG after:', JSON.stringify(massAfter?.cog))

  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  // Also try translation
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst],
    pivotInfo: [0, 0, 0],
    mucType: 'TRANSLATION_2D',
  })
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    offset: [50, 30, 0],
  })
  const massTrans = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[15] COG after translation attempt:', JSON.stringify(massTrans?.cog))
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  filewrite({ massBefore, massAfter, massTrans }, 'grounded-motion')

  return { asmId }
}
