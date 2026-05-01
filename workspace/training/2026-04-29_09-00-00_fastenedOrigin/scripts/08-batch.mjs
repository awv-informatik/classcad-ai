export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'FO_Batch' })).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Cube' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 20, width: 20, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [10, 10, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'B1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'B2' })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'B3' })).result

  // Batch creation — pass array of param objects
  const r = await api.v1.assembly.fastenedOrigin([
    { id: asmId, name: 'FO_B1', mate1: { path: [inst1], csys: wcs } },
    { id: asmId, name: 'FO_B2', mate1: { path: [inst2], csys: wcs }, xOffset: 40 },
    { id: asmId, name: 'FO_B3', mate1: { path: [inst3], csys: wcs }, xOffset: 80, zRotation: '45deg' },
  ])

  console.log('[08] batch result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[08] result is array:', Array.isArray(r.result))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-response')

  await snapshot('batch')

  return { asmId }
}
