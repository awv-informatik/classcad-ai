export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GFO_Deg' })).result

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

  // Create with degree string rotations
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId,
    name: 'FO_Deg',
    mate1: { path: [inst], csys: wcs },
    xRotation: '45deg',
    yRotation: '30deg',
    zRotation: '90deg',
  })).result

  const r = await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Deg' })
  console.log('[04] xRotation:', r.result.xRotation, '(expected ~0.785 = 45deg in rad)')
  console.log('[04] yRotation:', r.result.yRotation, '(expected ~0.524 = 30deg in rad)')
  console.log('[04] zRotation:', r.result.zRotation, '(expected ~1.571 = 90deg in rad)')
  console.log('[04] are values radians?', typeof r.result.xRotation === 'number')

  filewrite(r.result, 'get-degree-strings')

  return { asmId, foId }
}
