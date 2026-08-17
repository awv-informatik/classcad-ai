export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'PlanarZRot' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 100, width: 80, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Ref', origin: [50, 40, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Slider' })).result
  await api.v1.part.box({ id: tpl2, name: 'Block', length: 30, width: 30, height: 20 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Ref', origin: [15, 15, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result

  // zRotationLimits with both min and max (degree strings)
  const r = await api.v1.assembly.planar({
    id: asmId,
    name: 'PlanarZRot',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zRotationLimits: { min: '-90deg', max: '90deg' },
  })

  console.log('[04] planar zRotationLimits (deg):', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'zrot-deg-response')

  // zRotationLimits with radians
  const r2 = await api.v1.assembly.planar({
    id: asmId,
    name: 'PlanarZRotRad',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zRotationLimits: { min: -Math.PI / 4, max: Math.PI / 2 },
  })

  console.log('[04] planar zRotationLimits (rad):', r2.result, 'maxLevel:', r2.maxLevel)

  // partial zRotationLimits (min-only) — expect error based on revolute/cylindrical pattern
  const r3 = await api.v1.assembly.planar({
    id: asmId,
    name: 'PlanarZRotPartial',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zRotationLimits: { min: '-45deg' },
  })

  console.log('[04] planar partial zRotationLimits (min-only):', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) {
    console.log('[04] partial zRot messages:', JSON.stringify(r3.messages))
  }
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'zrot-partial-response')

  await snapshot('zrot')
  return { id1: r.result, id2: r2.result, id3: r3.result }
}
