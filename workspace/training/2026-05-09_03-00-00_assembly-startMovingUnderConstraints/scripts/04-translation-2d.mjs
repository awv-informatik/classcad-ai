export default async function (api, { snapshot, filewrite }) {
  // Test TRANSLATION_2D with a planar constraint (2 DOF: X and Y translation on a plane)
  const asmId = (await api.v1.assembly.create({})).result

  // Template A: floor plate 100x80x5
  const tplA = (await api.v1.assembly.partTemplate({ name: 'Floor' })).result
  await api.v1.part.box({ id: tplA, name: 'FloorBox', length: 100, width: 80, height: 5 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'PlaneA', origin: [0, 0, 5], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  // Template B: puck 25x25x20
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Puck' })).result
  await api.v1.part.box({ id: tplB, name: 'PuckBox', length: 25, width: 25, height: 20 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'PlaneB', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'FloorInst',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'PuckInst',
    transformation: [[10, 10, 5], [1, 0, 0], [0, 1, 0]],
  })).result

  // Ground the floor
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA },
  })

  // Planar constraint: puck can slide on XY plane
  const planR = await api.v1.assembly.planar({
    id: asmId, name: 'Plane',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })
  console.log('[04] planar:', planR.result, 'maxLevel:', planR.maxLevel)

  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[04] COG before:', JSON.stringify(massBefore?.cog))
  await snapshot('before')

  // Start TRANSLATION_2D
  const startR = await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst2],
    pivotInfo: [0, 0, 0],
    mucType: 'TRANSLATION_2D',
  })
  console.log('[04] start:', startR.result, 'maxLevel:', startR.maxLevel)

  // Move puck +40 in X, +30 in Y (both should be allowed in planar)
  const moveR = await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    offset: [40, 30, 0],
  })
  console.log('[04] move:', moveR.result, 'maxLevel:', moveR.maxLevel)

  const massAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[04] COG after:', JSON.stringify(massAfter?.cog))
  await snapshot('after-move')

  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  // Also test: move with Z component — should the planar constraint ignore it?
  const startR2 = await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst2],
    pivotInfo: [0, 0, 0],
    mucType: 'TRANSLATION_2D',
  })
  console.log('[04] start2:', startR2.result, 'maxLevel:', startR2.maxLevel)

  const moveR2 = await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    offset: [0, 0, 50],
  })
  console.log('[04] move2 (Z only):', moveR2.result, 'maxLevel:', moveR2.maxLevel)

  const massZ = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[04] COG after Z-only move:', JSON.stringify(massZ?.cog))

  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  await snapshot('after-z-attempt')

  filewrite({ massBefore, massAfter, massZ }, 'mass-comparison')

  return { asmId }
}
