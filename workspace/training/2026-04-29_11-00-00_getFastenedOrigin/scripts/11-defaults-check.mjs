export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GFO_Defaults' })).result

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

  // Create with all defaults — no offsets, no rotations, no flip, no reorient
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId,
    name: 'FO_Default',
    mate1: { path: [inst], csys: wcs },
  })).result

  const r = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Default' })).result

  // Check which default values appear
  console.log('[11] All keys in result:', Object.keys(r))
  console.log('[11] xOffset:', r.xOffset, '(expect 0)')
  console.log('[11] yOffset:', r.yOffset, '(expect 0)')
  console.log('[11] zOffset:', r.zOffset, '(expect 0)')
  console.log('[11] xRotation:', r.xRotation, '(expect 0)')
  console.log('[11] yRotation:', r.yRotation, '(expect 0)')
  console.log('[11] zRotation:', r.zRotation, '(expect 0)')
  console.log('[11] mate1.flip:', r.mate1.flip, '(expect Z)')
  console.log('[11] mate1.reorient:', r.mate1.reorient, '(expect 0)')
  console.log('[11] mate1 keys:', Object.keys(r.mate1))

  filewrite(r, 'defaults-check')

  return { asmId }
}
