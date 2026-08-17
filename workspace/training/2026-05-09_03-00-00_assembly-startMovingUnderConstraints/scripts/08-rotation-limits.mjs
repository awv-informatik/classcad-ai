export default async function (api, { snapshot, filewrite }) {
  // Test: do zRotationLimits on a revolute constrain the moveUnderConstraints range?
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

  // Revolute with ±45° limits
  await api.v1.assembly.revolute({
    id: asmId, name: 'Hinge',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zRotationLimits: { min: '-45deg', max: '45deg' },
  })

  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[08] COG before:', JSON.stringify(massBefore?.cog))

  // Test A: rotate within limits — 30° (within ±45°)
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst2],
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })
  // 30° CCW
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0.866, -0.5, 0], yDir: [0.5, 0.866, 0], zDir: [0, 0, 1] },
  })
  const mass30 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[08] COG after 30° (within limits):', JSON.stringify(mass30?.cog))
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  await snapshot('within-limits')

  // Reset
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst2],
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0.866, 0.5, 0], yDir: [-0.5, 0.866, 0], zDir: [0, 0, 1] },
  })
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  const massReset = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[08] COG after reset:', JSON.stringify(massReset?.cog))

  // Test B: rotate beyond limits — 90° (exceeds ±45°)
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst2],
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })
  // 90° CCW — should be clamped to 45°
  const moveR = await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0, -1, 0], yDir: [1, 0, 0], zDir: [0, 0, 1] },
  })
  console.log('[08] move 90° result:', moveR.result, 'maxLevel:', moveR.maxLevel)
  filewrite({ result: moveR.result, messages: moveR.messages, maxLevel: moveR.maxLevel }, 'beyond-limits-response')

  const mass90 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[08] COG after 90° (beyond limits):', JSON.stringify(mass90?.cog))
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  await snapshot('beyond-limits')

  // Compare COG of 45° (exact limit) for reference
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst2],
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0.707, -0.707, 0], yDir: [0.707, 0.707, 0], zDir: [0, 0, 1] },
  })
  const mass45 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[08] COG at 45° (exact limit):', JSON.stringify(mass45?.cog))
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  filewrite({ massBefore, mass30, massReset, mass90, mass45 }, 'limits-comparison')

  return { asmId }
}
