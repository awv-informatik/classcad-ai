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

  // Place block at Z=5 — below our limits min=20
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Block',
    transformation: [[0, 0, 5], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  const cogBefore = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[04] COG before:', JSON.stringify(cogBefore?.cog))

  // Slider with zOffsetLimits [20, 40] — should clamp Z from 5 up to 20
  const r = await api.v1.assembly.slider({
    id: asmId, name: 'Slide1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffsetLimits: { min: 20, max: 40 }
  })
  console.log('[04] slider result:', r.result, 'maxLevel:', r.maxLevel)

  const cogAfter = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[04] COG after:', JSON.stringify(cogAfter?.cog))
  // Expected Z clamped to 20 (COG.z=20+7.5=27.5)

  filewrite({
    cogBefore: cogBefore?.cog,
    cogAfter: cogAfter?.cog,
    maxLevel: r.maxLevel
  }, 'z-below-min-data')

  await snapshot('z-below-min')
  return {}
}
