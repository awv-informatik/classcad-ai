export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'PlanarAll' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 120, width: 100, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Ref', origin: [60, 50, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Part2' })).result
  await api.v1.part.box({ id: tpl2, name: 'Block', length: 40, width: 25, height: 15 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Ref', origin: [20, 12.5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result

  // Create with every optional param
  const r = await api.v1.assembly.planar({
    id: asmId,
    name: 'FullPlanar',
    mate1: { path: [inst1], csys: wcs1, flip: 'Z', reorient: '0' },
    mate2: { path: [inst2], csys: wcs2, flip: '-Z', reorient: '90' },
    zOffset: 20,
    xOffsetLimits: { min: -50, max: 50 },
    yOffsetLimits: { min: -30, max: 30 },
    zRotationLimits: { min: '-180deg', max: '180deg' },
  })

  console.log('[10] full planar:', r.result, 'maxLevel:', r.maxLevel)

  // Read back to verify all params persisted
  const get = await api.v1.assembly.getPlanar({ id: asmId, name: 'FullPlanar' })
  filewrite(get.result, 'full-planar-get')
  console.log('[10] getPlanar zOffset:', get.result.zOffset)
  console.log('[10] getPlanar xOffsetLimits:', JSON.stringify(get.result.xOffsetLimits))
  console.log('[10] getPlanar yOffsetLimits:', JSON.stringify(get.result.yOffsetLimits))
  console.log('[10] getPlanar zRotationLimits:', JSON.stringify(get.result.zRotationLimits))
  console.log('[10] getPlanar mate1.flip:', get.result.mate1.flip, 'mate1.reorient:', get.result.mate1.reorient)
  console.log('[10] getPlanar mate2.flip:', get.result.mate2.flip, 'mate2.reorient:', get.result.mate2.reorient)

  await snapshot('all-params')
  return { cId: r.result }
}
