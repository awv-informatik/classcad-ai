export default async function (api, { snapshot, filewrite }) {
  // Create assembly
  const asmId = (await api.v1.assembly.create({})).result
  console.log('[01] asmId:', asmId)

  // Template A — base (box 60x40x10)
  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result
  console.log('[01] tplA:', tplA, 'wcsA:', wcsA)

  // Template B — arm (box 80x20x8)
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result
  console.log('[01] tplB:', tplB, 'wcsB:', wcsB)

  // Return to assembly context
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create instances at distinct positions
  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Base',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm',
    transformation: [[100, 50, 30], [1, 0, 0], [0, 1, 0]]
  })).result
  console.log('[01] inst1:', inst1, 'inst2:', inst2)

  // Measure COG before constraint
  const massBefore1 = (await api.v1.part.calculateMassProperties({ id: inst1 })).result
  const massBefore2 = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[01] inst1 COG before:', massBefore1?.cog)
  console.log('[01] inst2 COG before:', massBefore2?.cog)

  await snapshot('before-cylindrical')

  // Ground inst1
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })).result
  console.log('[01] fastenedOrigin:', foId)

  // Create cylindrical constraint
  const cylId = (await api.v1.assembly.cylindrical({
    id: asmId,
    name: 'Cyl1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB }
  })).result
  console.log('[01] cylindrical result:', cylId)

  // Check for errors
  const cylR = await api.v1.assembly.cylindrical({
    id: asmId,
    name: 'Cyl1_check',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB }
  })
  console.log('[01] cylindrical maxLevel:', cylR.maxLevel)

  // Measure COG after constraint
  const massAfter1 = (await api.v1.part.calculateMassProperties({ id: inst1 })).result
  const massAfter2 = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[01] inst1 COG after:', massAfter1?.cog)
  console.log('[01] inst2 COG after:', massAfter2?.cog)

  filewrite({
    inst1CogBefore: massBefore1?.cog,
    inst1CogAfter: massAfter1?.cog,
    inst2CogBefore: massBefore2?.cog,
    inst2CogAfter: massAfter2?.cog,
    cylindricalId: cylId
  }, 'cog-comparison')

  await snapshot('after-cylindrical')

  // Read back constraint state
  const getR = await api.v1.assembly.getCylindrical({ id: asmId, name: 'Cyl1' })
  console.log('[01] getCylindrical maxLevel:', getR.maxLevel)
  filewrite(getR.result, 'getCylindrical-result')

  return { asmId, inst1, inst2, cylId }
}
