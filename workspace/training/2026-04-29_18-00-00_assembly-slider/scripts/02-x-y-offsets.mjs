export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'OffsetAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Rail' })).result
  await api.v1.part.box({ id: tpl1, name: 'RailBody', length: 100, width: 20, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Ax1', origin: [50, 10, 5],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Carriage' })).result
  await api.v1.part.box({ id: tpl2, name: 'Block', length: 20, width: 20, height: 15 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Ax2', origin: [10, 10, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'RailInst' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'CarriageInst' })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO1', mate1: { path: [inst1], csys: wcs1 } })

  // Test with xOffset and yOffset
  const r = await api.v1.assembly.slider({
    id: asmId,
    name: 'OffsetSlide',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    xOffset: 30,
    yOffset: 15,
  })

  console.log('[02] slider with offsets result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'offset-response')

  await snapshot('x-y-offsets')

  // Also test negative offsets
  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'Carriage2' })).result
  await api.v1.part.box({ id: tpl3, name: 'Block2', length: 15, width: 15, height: 10 })
  const wcs3 = (await api.v1.part.workCSys({
    id: tpl3, name: 'Ax3', origin: [7.5, 7.5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst3 = (await api.v1.assembly.instance({ productId: tpl3, ownerId: asmId, name: 'Carriage2Inst' })).result

  const r2 = await api.v1.assembly.slider({
    id: asmId,
    name: 'NegOffsetSlide',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst3], csys: wcs3 },
    xOffset: -20,
    yOffset: -10,
  })

  console.log('[02] negative offsets result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'neg-offset-response')

  await snapshot('neg-offsets')

  return { asmId }
}
