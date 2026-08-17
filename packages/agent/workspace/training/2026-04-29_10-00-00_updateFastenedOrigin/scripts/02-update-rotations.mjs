export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'RotUpdateTest' })).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 60, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
  })).result

  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO1',
    mate1: { path: [inst], csys: wcs },
  })).result

  // Update with radian rotation
  const r1 = await api.v1.assembly.updateFastenedOrigin({ id: foId, zRotation: Math.PI / 4 })
  console.log('[02] update zRotation (radians) result:', r1.result, 'maxLevel:', r1.maxLevel)
  const state1 = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO1' })).result
  console.log('[02] after radian update: zRotation=', state1.zRotation, '(expect ~0.785)')
  filewrite(state1, 'after-radian-rotation')
  await snapshot('radian-rotation')

  // Update with degree string
  const r2 = await api.v1.assembly.updateFastenedOrigin({ id: foId, zRotation: '90deg' })
  console.log('[02] update zRotation (degree string) result:', r2.result, 'maxLevel:', r2.maxLevel)
  const state2 = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO1' })).result
  console.log('[02] after deg update: zRotation=', state2.zRotation, '(expect ~1.5708)')
  filewrite(state2, 'after-degree-rotation')
  await snapshot('degree-rotation')

  // Update multiple rotation axes
  const r3 = await api.v1.assembly.updateFastenedOrigin({
    id: foId, xRotation: '45deg', yRotation: '30deg', zRotation: 0,
  })
  console.log('[02] multi-axis rotation result:', r3.result, 'maxLevel:', r3.maxLevel)
  const state3 = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO1' })).result
  console.log('[02] xRot:', state3.xRotation, 'yRot:', state3.yRotation, 'zRot:', state3.zRotation)
  filewrite(state3, 'after-multi-rotation')
  await snapshot('multi-rotation')

  return { foId }
}
