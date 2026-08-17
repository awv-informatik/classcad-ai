export default async function (api, { filewrite }) {
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
  })).result

  // Create with deg strings
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Deg',
    mate1: { path: [inst], csys: wcs },
    xRotation: '45deg',
    yRotation: '90deg',
    zRotation: '180deg',
  })).result
  console.log('[02] created with deg strings, id:', foId)

  const r = await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Deg' })
  console.log('[02] xRotation:', r.result.xRotation, '(expected ~0.7854)')
  console.log('[02] yRotation:', r.result.yRotation, '(expected ~1.5708)')
  console.log('[02] zRotation:', r.result.zRotation, '(expected ~3.1416)')
  filewrite(r.result, 'deg-strings-result')

  return { foId }
}
