export default async function (api, { snapshot, filewrite }) {
  // Test: moving multiple instances at once via instanceIds
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 30, width: 20, height: 15 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Wcs', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Block1',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const inst2 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Block2',
    transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const inst3 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Block3',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[10] inst1:', inst1, 'inst2:', inst2, 'inst3:', inst3)

  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[10] COG before:', JSON.stringify(massBefore?.cog))
  await snapshot('before')

  // Move inst1 AND inst2 (but NOT inst3)
  const startR = await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst1, inst2],
    pivotInfo: [0, 0, 0],
    mucType: 'TRANSLATION_2D',
  })
  console.log('[10] start:', startR.result, 'maxLevel:', startR.maxLevel)
  filewrite({ result: startR.result, messages: startR.messages, maxLevel: startR.maxLevel }, 'start-multi')

  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    offset: [0, 40, 0],
  })

  const massAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[10] COG after:', JSON.stringify(massAfter?.cog))
  await snapshot('after-multi-move')

  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  filewrite({ massBefore, massAfter }, 'multi-instance-comparison')

  return { asmId }
}
