export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GetAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Rail' })).result
  await api.v1.part.box({ id: tpl1, name: 'Body', length: 80, width: 20, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Ax1', origin: [40, 10, 5],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl2, name: 'Blk', length: 20, width: 15, height: 25 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Ax2', origin: [10, 7.5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })

  const cId = (await api.v1.assembly.slider({
    id: asmId, name: 'TestSlider',
    mate1: { path: [inst1], csys: wcs1, flip: 'Y', reorient: '90' },
    mate2: { path: [inst2], csys: wcs2 },
    xOffset: 15,
    yOffset: -5,
    zOffsetLimits: { min: -25, max: 35 },
  })).result

  console.log('[07] created slider id:', cId)

  // Get by name from assembly
  const r1 = await api.v1.assembly.getSlider({ id: asmId, name: 'TestSlider' })
  console.log('[07] getSlider result keys:', Object.keys(r1.result))
  filewrite(r1.result, 'get-slider-result')

  // Get by name from instance
  const r2 = await api.v1.assembly.getSlider({ id: inst1, name: 'TestSlider' })
  console.log('[07] getSlider from instance result:', r2.result ? 'found' : 'null', 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'get-from-instance')

  // Not found
  const r3 = await api.v1.assembly.getSlider({ id: asmId, name: 'NonExistent' })
  console.log('[07] not found result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[07] not found messages:', JSON.stringify(r3.messages))
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'not-found')

  return { asmId, cId }
}
