export default async function (api, { filewrite }) {
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
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Block',
    transformation: [[0, 0, 20], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  // Create slider with all params set
  const sliderId = (await api.v1.assembly.slider({
    id: asmId, name: 'Slide1',
    mate1: { path: [inst1], csys: wcsA, flip: '-Z', reorient: '90' },
    mate2: { path: [inst2], csys: wcsB, flip: 'X', reorient: '180' },
    xOffset: 25,
    yOffset: 10,
    zOffsetLimits: { min: 5, max: 50 }
  })).result
  console.log('[06] sliderId:', sliderId)

  // Query by name
  const r = await api.v1.assembly.getSlider({ id: asmId, name: 'Slide1' })
  console.log('[06] getSlider maxLevel:', r.maxLevel)
  filewrite(r.result, 'getSlider-result')

  // Query non-existent name
  const r2 = await api.v1.assembly.getSlider({ id: asmId, name: 'NonExistent' })
  console.log('[06] non-existent:', r2.result, 'maxLevel:', r2.maxLevel)

  // Query empty name
  const r3 = await api.v1.assembly.getSlider({ id: asmId, name: '' })
  console.log('[06] empty name:', r3.result, 'maxLevel:', r3.maxLevel)

  // Query with template ID (should fail)
  const r4 = await api.v1.assembly.getSlider({ id: tplA, name: 'Slide1' })
  console.log('[06] template ID:', r4.result, 'maxLevel:', r4.maxLevel)

  // Query with instance ID (should fail)
  const r5 = await api.v1.assembly.getSlider({ id: inst1, name: 'Slide1' })
  console.log('[06] instance ID:', r5.result, 'maxLevel:', r5.maxLevel)

  filewrite({
    found: { result: r.result, maxLevel: r.maxLevel },
    nonExistent: { result: r2.result, maxLevel: r2.maxLevel },
    emptyName: { result: r3.result, maxLevel: r3.maxLevel },
    templateId: { result: r4.result, maxLevel: r4.maxLevel },
    instanceId: { result: r5.result, maxLevel: r5.maxLevel }
  }, 'getSlider-cases')

  return { sliderId }
}
