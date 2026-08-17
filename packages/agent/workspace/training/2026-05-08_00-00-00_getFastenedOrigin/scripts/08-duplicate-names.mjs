export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst2',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create two constraints with same name
  const foId1 = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'SameName',
    mate1: { path: [inst1], csys: wcs },
    xOffset: 10,
  })).result
  const foId2 = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'SameName',
    mate1: { path: [inst2], csys: wcs },
    xOffset: 90,
  })).result
  console.log('[08] foId1:', foId1, 'foId2:', foId2)

  const r = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'SameName' })).result
  console.log('[08] duplicate name query — got id:', r.id)
  console.log('[08] which constraint? foId1=', foId1, 'foId2=', foId2, '→ returned:', r.id)
  console.log('[08] xOffset:', r.xOffset, '(10=first, 90=second)')
  filewrite({ foId1, foId2, returned: r }, 'duplicate-names')

  return {}
}
