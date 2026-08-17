export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GFO_Rot' })).result

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

  // Create with radian rotations
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId,
    name: 'FO_Rad',
    mate1: { path: [inst], csys: wcs },
    xRotation: Math.PI / 4,
    yRotation: Math.PI / 6,
    zRotation: Math.PI / 2,
  })).result

  const r = await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Rad' })
  console.log('[03] xRotation:', r.result.xRotation, '(expected:', Math.PI / 4, ')')
  console.log('[03] yRotation:', r.result.yRotation, '(expected:', Math.PI / 6, ')')
  console.log('[03] zRotation:', r.result.zRotation, '(expected:', Math.PI / 2, ')')

  filewrite(r.result, 'get-rotations')

  await snapshot('rotation-result')

  return { asmId, foId }
}
