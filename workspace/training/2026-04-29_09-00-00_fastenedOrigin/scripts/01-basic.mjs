export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'FO_Test' })).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [20, 15, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
    transformation: [[100, 50, 30], [1, 0, 0], [0, 1, 0]],
  })).result

  console.log('[01] inst:', inst, 'wcs:', wcs)

  await snapshot('before')

  const r = await api.v1.assembly.fastenedOrigin({
    id: asmId,
    name: 'FO1',
    mate1: { path: [inst], csys: wcs },
  })

  console.log('[01] fastenedOrigin result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'fo-response')

  await snapshot('after')

  return { asmId, tpl, inst, wcs, foId: r.result }
}
