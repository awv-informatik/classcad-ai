export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 60, width: 40, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS1', origin: [30, 20, 20],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl2, name: 'Box2', length: 30, width: 15, height: 50 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS2', origin: [15, 7, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'Block' })).result

  const cId = (await api.v1.assembly.fastened({
    id: asmId, name: 'F1',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    xOffset: 20,
  })).result

  await snapshot('before-rotation')

  // Update with radians
  const r1 = await api.v1.assembly.updateFastened({ id: cId, zRotation: Math.PI / 4 })
  console.log('[02] update zRotation rad:', r1.result, 'maxLevel:', r1.maxLevel)
  await snapshot('after-zrot-rad')

  const g1 = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[02] getFastened after rad zRot:', g1.zRotation)
  filewrite(g1, 'after-rad-rotation')

  // Update with degree string
  const r2 = await api.v1.assembly.updateFastened({ id: cId, zRotation: '90deg' })
  console.log('[02] update zRotation deg:', r2.result, 'maxLevel:', r2.maxLevel)
  await snapshot('after-zrot-deg')

  const g2 = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[02] getFastened after deg zRot:', g2.zRotation)
  filewrite(g2, 'after-deg-rotation')

  // Update xRotation + yRotation combined
  const r3 = await api.v1.assembly.updateFastened({ id: cId, xRotation: '45deg', yRotation: Math.PI / 6 })
  console.log('[02] update combo:', r3.result, 'maxLevel:', r3.maxLevel)
  await snapshot('after-combo')

  const g3 = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[02] getFastened after combo:', JSON.stringify({ x: g3.xRotation, y: g3.yRotation, z: g3.zRotation }))
  filewrite(g3, 'after-combo-rotation')

  return { cId }
}
