export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GFO_Test' })).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
  })).result

  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId,
    name: 'FO_Basic',
    mate1: { path: [inst], csys: wcs },
  })).result

  console.log('[01] foId:', foId)

  const r = await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Basic' })
  console.log('[01] getFastenedOrigin result:', JSON.stringify(r.result, null, 2))
  console.log('[01] maxLevel:', r.maxLevel)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'get-basic')

  await snapshot('result')

  return { asmId, foId }
}
