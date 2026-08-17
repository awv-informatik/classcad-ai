export default async function (api, { snapshot, filewrite }) {
  // Realistic workflow: animate a hinge door through multiple positions using start/move/finish
  const asmId = (await api.v1.assembly.create({})).result

  // Frame
  const tplFrame = (await api.v1.assembly.partTemplate({ name: 'Frame' })).result
  await api.v1.part.box({ id: tplFrame, name: 'FrameBox', length: 5, width: 80, height: 120 })
  const wcsFrame = (await api.v1.part.workCSys({ id: tplFrame, name: 'HingeF', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  // Door
  const tplDoor = (await api.v1.assembly.partTemplate({ name: 'Door' })).result
  await api.v1.part.box({ id: tplDoor, name: 'DoorBox', length: 3, width: 60, height: 100 })
  const wcsDoor = (await api.v1.part.workCSys({ id: tplDoor, name: 'HingeD', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const instFrame = (await api.v1.assembly.instance({
    productId: tplFrame, ownerId: asmId, name: 'FrameInst',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const instDoor = (await api.v1.assembly.instance({
    productId: tplDoor, ownerId: asmId, name: 'DoorInst',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Ground the frame
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FrameGround',
    mate1: { path: [instFrame], csys: wcsFrame },
  })

  // Revolute hinge with 0-120° range
  await api.v1.assembly.revolute({
    id: asmId, name: 'DoorHinge',
    mate1: { path: [instFrame], csys: wcsFrame },
    mate2: { path: [instDoor], csys: wcsDoor },
    zRotationLimits: { min: '0deg', max: '120deg' },
  })

  // Snapshot at 0° (closed)
  await snapshot('closed', { view: 'top' })

  // Open door to 45°
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [instDoor],
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })
  // 45° CCW around Z
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0.707, -0.707, 0], yDir: [0.707, 0.707, 0], zDir: [0, 0, 1] },
  })
  const mass45 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[17] COG at 45°:', JSON.stringify(mass45?.cog))
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  await snapshot('45deg', { view: 'top' })

  // Open door to 90°
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [instDoor],
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })
  // 45° from current (90° total) — remember, move is absolute from start
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0.707, -0.707, 0], yDir: [0.707, 0.707, 0], zDir: [0, 0, 1] },
  })
  const mass90 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[17] COG at 90°:', JSON.stringify(mass90?.cog))
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  await snapshot('90deg', { view: 'top' })

  filewrite({ mass45, mass90 }, 'door-positions')

  return { asmId }
}
