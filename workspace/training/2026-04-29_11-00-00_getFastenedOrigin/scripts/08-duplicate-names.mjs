export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GFO_Dupes' })).result

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

  // Create two constraints with same name but different offsets
  const fo1 = (await api.v1.assembly.fastenedOrigin({
    id: asmId,
    name: 'SameName',
    mate1: { path: [inst1], csys: wcs },
    xOffset: 10,
  })).result

  const fo2 = (await api.v1.assembly.fastenedOrigin({
    id: asmId,
    name: 'SameName',
    mate1: { path: [inst2], csys: wcs },
    xOffset: 99,
  })).result

  console.log('[08] fo1:', fo1, 'fo2:', fo2)

  const r = await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'SameName' })
  console.log('[08] returned id:', r.result.id)
  console.log('[08] matches fo1?', r.result.id === fo1)
  console.log('[08] matches fo2?', r.result.id === fo2)
  console.log('[08] xOffset:', r.result.xOffset, '(fo1=10, fo2=99)')

  filewrite({ fo1, fo2, getResult: r.result }, 'duplicate-names')

  return { asmId }
}
