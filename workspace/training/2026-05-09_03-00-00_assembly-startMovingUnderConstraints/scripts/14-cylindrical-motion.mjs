export default async function (api, { snapshot, filewrite }) {
  // Test: motion with cylindrical constraint (2 DOF: rotation around Z + translation along Z)
  const asmId = (await api.v1.assembly.create({})).result

  // Template A: base cylinder (r=30, h=10)
  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.cylinder({ id: tplA, name: 'BaseCyl', radius: 30, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'WcsA', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  // Template B: arm 60x15x8 (asymmetric so rotation is visible)
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'ArmBox', length: 60, width: 15, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'WcsB', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'BaseInst',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'ArmInst',
    transformation: [[0, 0, 20], [1, 0, 0], [0, 1, 0]],
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA },
  })
  await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylJoint',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })

  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[14] COG before:', JSON.stringify(massBefore?.cog))
  await snapshot('before')

  // Test A: ROTATION on cylindrical — should allow Z rotation
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst2],
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0, -1, 0], yDir: [1, 0, 0], zDir: [0, 0, 1] },
  })
  const massRot = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[14] COG after ROTATION 90°:', JSON.stringify(massRot?.cog))
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  await snapshot('after-rotation')

  // Test B: TRANSLATION_1D on cylindrical — should allow Z translation
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst2],
    pivotInfo: [0, 0, 0],
    mucType: 'TRANSLATION_1D',
  })
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    offset: [0, 0, 40],
  })
  const massTrans = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[14] COG after TRANSLATION_1D Z+40:', JSON.stringify(massTrans?.cog))
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  await snapshot('after-translation')

  filewrite({ massBefore, massRot, massTrans }, 'cylindrical-motion')

  return { asmId }
}
