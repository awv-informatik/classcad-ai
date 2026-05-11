export default async function (api, { snapshot, filewrite }) {
  // Test: does pivotInfo change the rotation center?
  // Setup: revolute hinge, test two different pivotInfo values with the same rotation
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

  // Test A: pivotInfo at origin [0,0,0] — rotate 45° around Z
  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[06] COG before:', JSON.stringify(massBefore?.cog))

  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst2],
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })
  // 45° CCW around Z: cos45≈0.707, sin45≈0.707
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0.707, -0.707, 0], yDir: [0.707, 0.707, 0], zDir: [0, 0, 1] },
  })
  const massA = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[06] COG after pivot=[0,0,0]:', JSON.stringify(massA?.cog))
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  await snapshot('pivot-origin')

  // Reset arm back to 0° by doing -45° rotation
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst2],
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })
  // -45° (inverse of the previous)
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0.707, 0.707, 0], yDir: [-0.707, 0.707, 0], zDir: [0, 0, 1] },
  })
  const massReset = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[06] COG after reset:', JSON.stringify(massReset?.cog))
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  // Test B: pivotInfo at [40, 20, 0] — same 45° rotation but different pivot
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst2],
    pivotInfo: [40, 20, 0],
    mucType: 'ROTATION',
  })
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0.707, -0.707, 0], yDir: [0.707, 0.707, 0], zDir: [0, 0, 1] },
  })
  const massB = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[06] COG after pivot=[40,20,0]:', JSON.stringify(massB?.cog))
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  await snapshot('pivot-offset')

  filewrite({ massBefore, massA, massReset, massB }, 'pivot-comparison')

  return { asmId }
}
