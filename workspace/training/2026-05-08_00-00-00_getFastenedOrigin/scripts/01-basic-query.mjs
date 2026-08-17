export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
    transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Test',
    mate1: { path: [inst], csys: wcs },
    xOffset: 25, yOffset: 10, zOffset: 5,
  })).result
  console.log('[01] fastenedOrigin created, id:', foId)

  const r = await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Test' })
  console.log('[01] getFastenedOrigin result:', JSON.stringify(r.result, null, 2))
  console.log('[01] maxLevel:', r.maxLevel)
  filewrite(r.result, 'basic-query-result')

  await snapshot('basic')
  return { asmId, tpl, inst, foId, wcs }
}
