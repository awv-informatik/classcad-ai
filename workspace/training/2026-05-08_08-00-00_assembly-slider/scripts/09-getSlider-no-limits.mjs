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
    transformation: [[0, 0, 25], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  // Create slider with NO zOffsetLimits, just basic
  const sliderId = (await api.v1.assembly.slider({
    id: asmId, name: 'Slide1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    xOffset: 10,
    yOffset: 5
  })).result

  // getSlider — check what zOffsetLimits looks like when not set
  const r = await api.v1.assembly.getSlider({ id: asmId, name: 'Slide1' })
  console.log('[09] getSlider result keys:', Object.keys(r.result))
  console.log('[09] xOffset:', r.result.xOffset)
  console.log('[09] yOffset:', r.result.yOffset)
  console.log('[09] zOffsetLimits:', JSON.stringify(r.result.zOffsetLimits))

  filewrite(r.result, 'getSlider-no-limits')

  // Also test batch getSlider
  const rBatch = await api.v1.assembly.getSlider([
    { id: asmId, name: 'Slide1' },
    { id: asmId, name: 'NonExistent' }
  ])
  console.log('[09] batch result:', JSON.stringify(rBatch.result?.map(r => r?.id ?? null)))
  console.log('[09] batch maxLevel:', rBatch.maxLevel)
  filewrite(rBatch, 'getSlider-batch')

  return { sliderId }
}
