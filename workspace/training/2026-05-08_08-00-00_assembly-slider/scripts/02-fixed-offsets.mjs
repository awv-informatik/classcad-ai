export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Rail' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 100, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 20, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Rail'
  })).result

  // Place block at [50, 25, 30]
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Block',
    transformation: [[50, 25, 30], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  const cogBefore = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[02] COG before:', JSON.stringify(cogBefore?.cog))
  // Expected: 50+10=60, 25+10=35, 30+7.5=37.5

  // Create slider with xOffset=40, yOffset=15
  const r = await api.v1.assembly.slider({
    id: asmId, name: 'Slide1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    xOffset: 40,
    yOffset: 15
  })
  console.log('[02] slider result:', r.result, 'maxLevel:', r.maxLevel)

  const cogAfter = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[02] COG after:', JSON.stringify(cogAfter?.cog))
  // Expected: xOffset=40 → inst2 X=40, COG.x=40+10=50
  //           yOffset=15 → inst2 Y=15, COG.y=15+10=25
  //           Z preserved at 30, COG.z=30+7.5=37.5

  filewrite({
    cogBefore: cogBefore?.cog,
    cogAfter: cogAfter?.cog,
    maxLevel: r.maxLevel,
    result: r.result
  }, 'fixed-offsets-data')

  await snapshot('fixed-offsets')

  return { asmId, inst1, inst2, sliderId: r.result }
}
