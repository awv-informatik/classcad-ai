export default async function (api, { snapshot, filewrite }) {
  // Test TRANSLATION_1D with offset along the slider's free axis (Z)
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Rail' })).result
  await api.v1.part.box({ id: tplA, name: 'RailBox', length: 100, width: 20, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'SlideA', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

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

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA },
  })

  await api.v1.assembly.slider({
    id: asmId, name: 'Slide',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })

  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[03] COG before:', JSON.stringify(massBefore?.cog))
  await snapshot('before')

  // TRANSLATION_1D — offset along Z (the slider's free axis)
  const startR = await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst2],
    pivotInfo: [0, 0, 0],
    mucType: 'TRANSLATION_1D',
  })
  console.log('[03] start:', startR.result, 'maxLevel:', startR.maxLevel)

  const moveR = await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    offset: [0, 0, 50],
  })
  console.log('[03] move:', moveR.result, 'maxLevel:', moveR.maxLevel)
  filewrite({ result: moveR.result, messages: moveR.messages, maxLevel: moveR.maxLevel }, 'move-response')

  const massAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[03] COG after move:', JSON.stringify(massAfter?.cog))
  await snapshot('after-move')

  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  const massFinal = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[03] COG final:', JSON.stringify(massFinal?.cog))

  filewrite({ massBefore, massAfter, massFinal }, 'mass-comparison')

  return { asmId }
}
