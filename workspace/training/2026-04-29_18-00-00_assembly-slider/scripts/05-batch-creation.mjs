export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'BatchAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Rail' })).result
  await api.v1.part.box({ id: tpl1, name: 'Body', length: 100, width: 30, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Ax1', origin: [50, 15, 5],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl2, name: 'Blk', length: 15, width: 15, height: 20 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Ax2', origin: [7.5, 7.5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'Block2' })).result
  await api.v1.part.box({ id: tpl3, name: 'Blk2', length: 12, width: 12, height: 18 })
  const wcs3 = (await api.v1.part.workCSys({
    id: tpl3, name: 'Ax3', origin: [6, 6, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl3, ownerId: asmId })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })

  // Batch creation: array of params
  const r = await api.v1.assembly.slider([
    {
      id: asmId, name: 'BatchSlide1',
      mate1: { path: [inst1], csys: wcs1 },
      mate2: { path: [inst2], csys: wcs2 },
      xOffset: 10,
    },
    {
      id: asmId, name: 'BatchSlide2',
      mate1: { path: [inst1], csys: wcs1 },
      mate2: { path: [inst3], csys: wcs3 },
      xOffset: -10,
    },
  ])

  console.log('[05] batch result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[05] result is array?', Array.isArray(r.result))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-response')

  await snapshot('batch-slider')

  return { asmId }
}
