export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GFO_Batch' })).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
  })).result

  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst2',
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_A',
    mate1: { path: [inst1], csys: wcs },
    xOffset: 10,
  })

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_B',
    mate1: { path: [inst2], csys: wcs },
    xOffset: 80,
  })

  // Batch get — array of params
  const r = await api.v1.assembly.getFastenedOrigin([
    { id: asmId, name: 'FO_A' },
    { id: asmId, name: 'FO_B' },
  ])

  console.log('[10] batch result type:', typeof r.result, Array.isArray(r.result))
  console.log('[10] batch result:', JSON.stringify(r.result, null, 2))
  console.log('[10] maxLevel:', r.maxLevel)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-get')

  return { asmId }
}
