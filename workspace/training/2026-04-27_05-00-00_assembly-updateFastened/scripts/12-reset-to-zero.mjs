export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 60, width: 40, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS1', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl2, name: 'Box2', length: 20, width: 20, height: 30 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS2', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'Block' })).result

  // Create with non-zero offsets and rotations
  const cId = (await api.v1.assembly.fastened({
    id: asmId, name: 'F1',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    xOffset: 50, yOffset: 25, zOffset: 10,
    zRotation: '45deg',
  })).result

  const g0 = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[12] before reset:', JSON.stringify({ x: g0.xOffset, y: g0.yOffset, z: g0.zOffset, zR: g0.zRotation }))

  // Reset all offsets and rotation to 0
  const r = await api.v1.assembly.updateFastened({
    id: cId,
    xOffset: 0, yOffset: 0, zOffset: 0,
    xRotation: 0, yRotation: 0, zRotation: 0,
  })
  console.log('[12] reset result:', r.result, 'maxLevel:', r.maxLevel)

  const g1 = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[12] after reset:', JSON.stringify({ x: g1.xOffset, y: g1.yOffset, z: g1.zOffset, zR: g1.zRotation }))
  filewrite(g1, 'after-reset')

  // Also test: can you reset flip/reorient back to defaults?
  // First set non-default flip
  await api.v1.assembly.updateFastened({ id: cId, mate1: { flip: '-X', reorient: '270' } })
  const g2 = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[12] after non-default flip:', JSON.stringify({ m1flip: g2.mate1.flip, m1reor: g2.mate1.reorient }))

  // Reset flip/reorient to defaults
  const r3 = await api.v1.assembly.updateFastened({ id: cId, mate1: { flip: 'Z', reorient: '0' } })
  console.log('[12] reset flip/reorient:', r3.result, 'maxLevel:', r3.maxLevel)
  const g3 = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[12] after flip reset:', JSON.stringify({ m1flip: g3.mate1.flip, m1reor: g3.mate1.reorient }))
  filewrite(g3, 'after-flip-reset')

  return { cId }
}
