export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'PartialAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Rail' })).result
  await api.v1.part.box({ id: tpl1, name: 'Body', length: 80, width: 20, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Ax1', origin: [40, 10, 5],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl2, name: 'Blk', length: 20, width: 15, height: 25 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Ax2', origin: [10, 7.5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })

  // Create with full limits
  const cId = (await api.v1.assembly.slider({
    id: asmId, name: 'LimitSlider',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zOffsetLimits: { min: -20, max: 30 },
  })).result
  console.log('[09] created slider:', cId)

  const before = (await api.v1.assembly.getSlider({ id: asmId, name: 'LimitSlider' })).result
  console.log('[09] before limits:', JSON.stringify(before.zOffsetLimits))
  filewrite(before, 'before-partial')

  // Update with min only — does max stay?
  const r1 = await api.v1.assembly.updateSlider({ id: cId, zOffsetLimits: { min: -50 } })
  console.log('[09] update min-only result:', r1.result, 'maxLevel:', r1.maxLevel)

  const afterMin = (await api.v1.assembly.getSlider({ id: asmId, name: 'LimitSlider' })).result
  console.log('[09] after min-only update limits:', JSON.stringify(afterMin.zOffsetLimits))
  filewrite(afterMin, 'after-min-update')

  // Update with max only — does min stay?
  const r2 = await api.v1.assembly.updateSlider({ id: cId, zOffsetLimits: { max: 100 } })
  console.log('[09] update max-only result:', r2.result, 'maxLevel:', r2.maxLevel)

  const afterMax = (await api.v1.assembly.getSlider({ id: asmId, name: 'LimitSlider' })).result
  console.log('[09] after max-only update limits:', JSON.stringify(afterMax.zOffsetLimits))
  filewrite(afterMax, 'after-max-update')

  // Clear limits by setting VOID/null
  const r3 = await api.v1.assembly.updateSlider({ id: cId, zOffsetLimits: null })
  console.log('[09] clear limits result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[09] clear limits messages:', JSON.stringify(r3.messages))

  const afterClear = (await api.v1.assembly.getSlider({ id: asmId, name: 'LimitSlider' })).result
  console.log('[09] after clear limits:', JSON.stringify(afterClear.zOffsetLimits))
  filewrite(afterClear, 'after-clear-limits')

  return { asmId, cId }
}
