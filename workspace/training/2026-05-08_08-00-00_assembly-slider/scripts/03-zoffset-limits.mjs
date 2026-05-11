export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Rail' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 100, width: 20, height: 10 })
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

  // Place block at [0, 0, 50] — well above the limits we'll set
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Block',
    transformation: [[0, 0, 50], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  const cogBefore = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[03] COG before:', JSON.stringify(cogBefore?.cog))
  // Expected: 0+10=10, 0+10=10, 50+7.5=57.5

  // Create slider with zOffsetLimits [10, 30] — should clamp Z from 50 down to 30
  const r = await api.v1.assembly.slider({
    id: asmId, name: 'Slide1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffsetLimits: { min: 10, max: 30 }
  })
  console.log('[03] slider result:', r.result, 'maxLevel:', r.maxLevel)

  const cogAfter = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[03] COG after:', JSON.stringify(cogAfter?.cog))
  // Expected: X reset to 0 (COG.x=10), Y=0 (COG.y=10), Z clamped to 30 (COG.z=30+7.5=37.5)

  filewrite({
    cogBefore: cogBefore?.cog,
    cogAfter: cogAfter?.cog,
    maxLevel: r.maxLevel
  }, 'zoffset-limits-data')

  await snapshot('zoffset-limits')

  return { asmId, sliderId: r.result }
}
