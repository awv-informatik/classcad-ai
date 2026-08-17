export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'ComboAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Rail' })).result
  await api.v1.part.box({ id: tpl1, name: 'Body', length: 100, width: 30, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Ax1', origin: [50, 15, 5],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Carriage' })).result
  await api.v1.part.box({ id: tpl2, name: 'Blk', length: 20, width: 20, height: 30 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Ax2', origin: [10, 10, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })

  // Realistic usage: all params together
  const cId = (await api.v1.assembly.slider({
    id: asmId,
    name: 'LinearGuide',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    xOffset: 10,
    yOffset: -5,
    zOffsetLimits: { min: -40, max: 40 },
  })).result

  console.log('[13] combined slider:', cId)

  const r = await api.v1.assembly.getSlider({ id: asmId, name: 'LinearGuide' })
  console.log('[13] retrieved xOffset:', r.result?.xOffset)
  console.log('[13] retrieved yOffset:', r.result?.yOffset)
  console.log('[13] retrieved zOffsetLimits:', JSON.stringify(r.result?.zOffsetLimits))
  filewrite(r.result, 'combined-result')

  await snapshot('combined-slider')

  return { asmId, cId }
}
