export default async function (api, { snapshot, filewrite }) {
  // Assembly: grounded base + revolute arm, then rotate the arm under constraints
  const asmId = (await api.v1.assembly.create({})).result
  console.log('[01] asmId:', asmId)

  // Template A: base plate 60x40x10
  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'BaseBox', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'HingeA', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  // Template B: arm 80x20x8
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'ArmBox', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'HingeB', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  console.log('[01] tplA:', tplA, 'wcsA:', wcsA, 'tplB:', tplB, 'wcsB:', wcsB)

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'BaseInst',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'ArmInst',
    transformation: [[100, 80, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[01] inst1:', inst1, 'inst2:', inst2)

  // Ground the base
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA },
  })

  // Revolute constraint: arm hinges on base
  const revR = await api.v1.assembly.revolute({
    id: asmId, name: 'Hinge',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })
  console.log('[01] revolute:', revR.result, 'maxLevel:', revR.maxLevel)

  // COG before motion
  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[01] COG before:', JSON.stringify(massBefore?.centerOfGravity))
  await snapshot('before-motion')

  // Step 1: startMovingUnderConstraints — ROTATION mode
  const startR = await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst2],
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })
  console.log('[01] startMoving result:', startR.result, 'maxLevel:', startR.maxLevel)
  filewrite({ result: startR.result, messages: startR.messages, maxLevel: startR.maxLevel }, 'start-response')

  // Step 2: moveUnderConstraints — 90° rotation around Z
  // rotation basis: 90° CCW around Z = xDir=[0,-1,0], yDir=[1,0,0], zDir=[0,0,1]
  const moveR = await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0, -1, 0], yDir: [1, 0, 0], zDir: [0, 0, 1] },
  })
  console.log('[01] move result:', moveR.result, 'maxLevel:', moveR.maxLevel)
  filewrite({ result: moveR.result, messages: moveR.messages, maxLevel: moveR.maxLevel }, 'move-response')

  // COG after move (before finish)
  const massMid = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[01] COG mid:', JSON.stringify(massMid?.centerOfGravity))
  await snapshot('after-move')

  // Step 3: finishMovingUnderConstraints
  const finishR = await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  console.log('[01] finish result:', finishR.result, 'maxLevel:', finishR.maxLevel)
  filewrite({ result: finishR.result, messages: finishR.messages, maxLevel: finishR.maxLevel }, 'finish-response')

  // COG after finish
  const massAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[01] COG after:', JSON.stringify(massAfter?.centerOfGravity))
  await snapshot('after-finish')

  filewrite({ massBefore, massMid, massAfter }, 'mass-comparison')

  return { asmId, inst1, inst2 }
}
