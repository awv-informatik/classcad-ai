export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'PlanarLimits' })).result

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

  // Test xOffsetLimits and yOffsetLimits
  const r = await api.v1.assembly.planar({
    id: asmId,
    name: 'PlanarXYLimits',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    xOffsetLimits: { min: -20, max: 40 },
    yOffsetLimits: { min: -10, max: 30 },
  })

  console.log('[03] planar with xOffset/yOffset limits:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'xy-limits-response')

  // Test partial xOffsetLimits (min-only)
  const r2 = await api.v1.assembly.planar({
    id: asmId,
    name: 'PlanarPartialX',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    xOffsetLimits: { min: -10 },
  })

  console.log('[03] planar partial xOffsetLimits (min-only):', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'partial-x-response')

  // Test partial yOffsetLimits (max-only)
  const r3 = await api.v1.assembly.planar({
    id: asmId,
    name: 'PlanarPartialY',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    yOffsetLimits: { max: 50 },
  })

  console.log('[03] planar partial yOffsetLimits (max-only):', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'partial-y-response')

  await snapshot('xy-limits')
  return { id1: r.result, id2: r2.result, id3: r3.result }
}
