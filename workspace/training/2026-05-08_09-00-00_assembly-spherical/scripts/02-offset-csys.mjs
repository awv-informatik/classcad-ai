export default async function (api, { snapshot, filewrite }) {
  // Verify: spherical ignores csys spatial position (same as fastened/revolute)
  // Use csys at different locations in each template — result should be the same
  const asmId = (await api.v1.assembly.create({})).result

  // Template A: base with csys at box center [30, 30, 5]
  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 60, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [30, 30, 5],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  // Template B: arm with csys at end [40, 5, 4]
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 40, width: 10, height: 8 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [40, 5, 4],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Base'
  })).result

  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm',
    transformation: [[80, 30, 20], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  const cogBefore = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[02] COG before:', JSON.stringify(cogBefore?.cog))

  const r = await api.v1.assembly.spherical({
    id: asmId, name: 'Ball1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB }
  })
  console.log('[02] spherical result:', r.result, 'maxLevel:', r.maxLevel)

  const cogAfter = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[02] COG after:', JSON.stringify(cogAfter?.cog))

  // If csys has no spatial effect, inst2 origin should be at inst1 origin [0,0,0]
  // Template COG = [20, 5, 4], so world COG should be [20, 5, 4]
  // If csys DOES have spatial effect, wcsA world=[30,30,5] should match wcsB,
  // putting inst2 at [30-40, 30-5, 5-4] = [-10, 25, 1] -> world COG = [10, 30, 5]

  filewrite({
    sphericalResult: r.result,
    maxLevel: r.maxLevel,
    cogBefore: cogBefore?.cog,
    cogAfter: cogAfter?.cog,
    prediction_no_spatial: { x: 20, y: 5, z: 4 },
    prediction_spatial: { x: 10, y: 30, z: 5 }
  }, 'offset-csys-data')

  await snapshot('offset-csys')
  return { asmId }
}
