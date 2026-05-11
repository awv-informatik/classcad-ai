export default async function (api, { snapshot, filewrite }) {
  // Test: what happens if we skip startMovingUnderConstraints and go straight to move?
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'BaseBox', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'WcsA', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'ArmBox', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'WcsB', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'BaseInst',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'ArmInst',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA },
  })
  await api.v1.assembly.revolute({
    id: asmId, name: 'Hinge',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })

  // Test A: moveUnderConstraints WITHOUT startMoving first
  console.log('[05] --- Test A: move without start ---')
  const moveR = await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0, -1, 0], yDir: [1, 0, 0], zDir: [0, 0, 1] },
  })
  console.log('[05] move result:', moveR.result, 'maxLevel:', moveR.maxLevel)
  filewrite({ result: moveR.result, messages: moveR.messages, maxLevel: moveR.maxLevel }, 'move-without-start')

  // Test B: finishMovingUnderConstraints WITHOUT startMoving first
  console.log('[05] --- Test B: finish without start ---')
  const finishR = await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  console.log('[05] finish result:', finishR.result, 'maxLevel:', finishR.maxLevel)
  filewrite({ result: finishR.result, messages: finishR.messages, maxLevel: finishR.maxLevel }, 'finish-without-start')

  // Test C: double start (start → start without finish)
  console.log('[05] --- Test C: double start ---')
  const start1 = await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst2],
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })
  console.log('[05] start1:', start1.result, 'maxLevel:', start1.maxLevel)

  const start2 = await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst2],
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })
  console.log('[05] start2:', start2.result, 'maxLevel:', start2.maxLevel)
  filewrite({ result: start2.result, messages: start2.messages, maxLevel: start2.maxLevel }, 'double-start')

  // Clean up
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  return { asmId }
}
