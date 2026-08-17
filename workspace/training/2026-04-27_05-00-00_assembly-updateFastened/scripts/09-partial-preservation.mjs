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

  // Create with many params
  const cId = (await api.v1.assembly.fastened({
    id: asmId, name: 'Full',
    mate1: { path: [inst1], csys: wcs1, flip: '-Z', reorient: '90' },
    mate2: { path: [inst2], csys: wcs2, flip: 'X', reorient: '180' },
    xOffset: 10, yOffset: 20, zOffset: 30,
    xRotation: '45deg', yRotation: '30deg', zRotation: '60deg',
  })).result

  const before = (await api.v1.assembly.getFastened({ id: asmId, name: 'Full' })).result
  console.log('[09] BEFORE:', JSON.stringify({
    name: before.name,
    x: before.xOffset, y: before.yOffset, z: before.zOffset,
    xR: before.xRotation, yR: before.yRotation, zR: before.zRotation,
    m1flip: before.mate1.flip, m1reor: before.mate1.reorient,
    m2flip: before.mate2.flip, m2reor: before.mate2.reorient,
  }))
  filewrite(before, 'before-partial')

  // Only update xOffset — everything else should be preserved
  const r = await api.v1.assembly.updateFastened({ id: cId, xOffset: 99 })
  console.log('[09] update xOffset only:', r.result, 'maxLevel:', r.maxLevel)

  const after = (await api.v1.assembly.getFastened({ id: asmId, name: 'Full' })).result
  console.log('[09] AFTER:', JSON.stringify({
    name: after.name,
    x: after.xOffset, y: after.yOffset, z: after.zOffset,
    xR: after.xRotation, yR: after.yRotation, zR: after.zRotation,
    m1flip: after.mate1.flip, m1reor: after.mate1.reorient,
    m2flip: after.mate2.flip, m2reor: after.mate2.reorient,
  }))
  filewrite(after, 'after-partial')

  // Check every preserved field
  const preserved = {
    name: before.name === after.name,
    yOffset: before.yOffset === after.yOffset,
    zOffset: before.zOffset === after.zOffset,
    xRotation: before.xRotation === after.xRotation,
    yRotation: before.yRotation === after.yRotation,
    zRotation: before.zRotation === after.zRotation,
    mate1_flip: before.mate1.flip === after.mate1.flip,
    mate1_reorient: before.mate1.reorient === after.mate1.reorient,
    mate2_flip: before.mate2.flip === after.mate2.flip,
    mate2_reorient: before.mate2.reorient === after.mate2.reorient,
    mate1_csys: before.mate1.csys === after.mate1.csys,
    mate2_csys: before.mate2.csys === after.mate2.csys,
    xOffsetChanged: before.xOffset !== after.xOffset,
  }
  console.log('[09] preservation check:', JSON.stringify(preserved))
  filewrite(preserved, 'preservation-check')

  return { cId }
}
