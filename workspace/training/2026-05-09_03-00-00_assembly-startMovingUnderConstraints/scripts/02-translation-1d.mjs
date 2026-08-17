export default async function (api, { snapshot, filewrite }) {
  // Test TRANSLATION_1D mucType with a slider constraint (1 DOF translation)
  const asmId = (await api.v1.assembly.create({})).result

  // Template A: rail 100x20x10
  const tplA = (await api.v1.assembly.partTemplate({ name: 'Rail' })).result
  await api.v1.part.box({ id: tplA, name: 'RailBox', length: 100, width: 20, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'SlideA', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  // Template B: slider block 30x20x15
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplB, name: 'BlockBox', length: 30, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'SlideB', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'RailInst',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'BlockInst',
    transformation: [[10, 0, 15], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[02] inst1:', inst1, 'inst2:', inst2)

  // Ground the rail
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA },
  })

  // Slider constraint: block can slide along X on the rail
  const sliderR = await api.v1.assembly.slider({
    id: asmId, name: 'Slide',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })
  console.log('[02] slider:', sliderR.result, 'maxLevel:', sliderR.maxLevel)

  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[02] COG before:', JSON.stringify(massBefore?.cog))
  await snapshot('before')

  // Start moving with TRANSLATION_1D
  const startR = await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst2],
    pivotInfo: [0, 0, 0],
    mucType: 'TRANSLATION_1D',
  })
  console.log('[02] start:', startR.result, 'maxLevel:', startR.maxLevel)
  filewrite({ result: startR.result, messages: startR.messages, maxLevel: startR.maxLevel }, 'start-response')

  // Move: translate +50 in X
  const moveR = await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    offset: [50, 0, 0],
  })
  console.log('[02] move:', moveR.result, 'maxLevel:', moveR.maxLevel)
  filewrite({ result: moveR.result, messages: moveR.messages, maxLevel: moveR.maxLevel }, 'move-response')

  const massMid = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[02] COG mid:', JSON.stringify(massMid?.cog))
  await snapshot('after-move')

  // Finish
  const finishR = await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  console.log('[02] finish:', finishR.result, 'maxLevel:', finishR.maxLevel)

  const massAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[02] COG after:', JSON.stringify(massAfter?.cog))
  await snapshot('after-finish')

  filewrite({ massBefore, massMid, massAfter }, 'mass-comparison')

  return { asmId, inst1, inst2 }
}
