export default async function (api, { snapshot, filewrite }) {
  // Create assembly
  const asmId = (await api.v1.assembly.create({})).result

  // Template A: base plate
  const tplA = (await api.v1.assembly.partTemplate({ name: 'Rail' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 100, width: 20, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  // Template B: slider block
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 20, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance 1: grounded rail
  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Rail'
  })).result

  // Instance 2: block at [30, 0, 20]
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Block',
    transformation: [[30, 0, 20], [1, 0, 0], [0, 1, 0]]
  })).result

  // Ground inst1
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  // Measure COG before slider
  const cogBefore = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[01] COG before:', JSON.stringify(cogBefore?.cog))

  // Create slider constraint
  const r = await api.v1.assembly.slider({
    id: asmId, name: 'Slide1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB }
  })
  console.log('[01] slider result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[01] messages:', JSON.stringify(r.messages))

  // Measure COG after slider
  const cogAfter = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[01] COG after:', JSON.stringify(cogAfter?.cog))

  filewrite({
    sliderResult: r.result,
    maxLevel: r.maxLevel,
    messages: r.messages,
    cogBefore: cogBefore?.cog,
    cogAfter: cogAfter?.cog
  }, 'basic-slider-data')

  await snapshot('basic-slider')

  return { asmId, tplA, tplB, wcsA, wcsB, inst1, inst2, sliderId: r.result }
}
