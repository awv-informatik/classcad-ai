export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  // Template A: base plate (grounded)
  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 60, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [30, 30, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  // Template B: arm (constrained)
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 40, width: 10, height: 8 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 5, 4],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance 1: grounded base
  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Base'
  })).result

  // Instance 2: arm at offset [80, 0, 20]
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm',
    transformation: [[80, 0, 20], [1, 0, 0], [0, 1, 0]]
  })).result

  // Ground inst1
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  // Measure COG before spherical
  const cogBefore = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[01] COG before:', JSON.stringify(cogBefore?.cog))

  // Create spherical constraint
  const r = await api.v1.assembly.spherical({
    id: asmId, name: 'Ball1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB }
  })
  console.log('[01] spherical result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[01] messages:', JSON.stringify(r.messages))

  // Measure COG after spherical
  const cogAfter = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[01] COG after:', JSON.stringify(cogAfter?.cog))

  filewrite({
    sphericalResult: r.result,
    maxLevel: r.maxLevel,
    messages: r.messages,
    cogBefore: cogBefore?.cog,
    cogAfter: cogAfter?.cog
  }, 'basic-spherical-data')

  await snapshot('basic-spherical')

  return { asmId, tplA, tplB, wcsA, wcsB, inst1, inst2, sphericalId: r.result }
}
