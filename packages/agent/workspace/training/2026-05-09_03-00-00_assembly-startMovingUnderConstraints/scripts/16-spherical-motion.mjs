export default async function (api, { snapshot, filewrite }) {
  // Test: motion with spherical constraint (3 DOF: X/Y/Z rotation)
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Socket' })).result
  await api.v1.part.box({ id: tplA, name: 'SocketBox', length: 40, width: 40, height: 20 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'WcsA', origin: [20, 20, 20], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'ArmBox', length: 80, width: 15, height: 10 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'WcsB', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'SocketInst',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'ArmInst',
    transformation: [[0, 0, 30], [1, 0, 0], [0, 1, 0]],
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA },
  })
  await api.v1.assembly.spherical({
    id: asmId, name: 'Ball',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })

  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[16] COG before:', JSON.stringify(massBefore?.cog))
  await snapshot('before')

  // Rotate around X axis (pitch) — 45°
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst2],
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })
  // 45° around X: Y→Z, Z→-Y
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [1, 0, 0], yDir: [0, 0.707, -0.707], zDir: [0, 0.707, 0.707] },
  })
  const massXRot = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[16] COG after X rotation 45°:', JSON.stringify(massXRot?.cog))
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  await snapshot('after-x-rotation')

  // Rotate around Y axis — 45°
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst2],
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })
  // 45° around Y: X→Z, Z→-X
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0.707, 0, 0.707], yDir: [0, 1, 0], zDir: [-0.707, 0, 0.707] },
  })
  const massYRot = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[16] COG after Y rotation 45°:', JSON.stringify(massYRot?.cog))
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  await snapshot('after-y-rotation')

  filewrite({ massBefore, massXRot, massYRot }, 'spherical-motion')

  return { asmId }
}
