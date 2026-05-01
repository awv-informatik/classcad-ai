export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'UpdateAsm' })).result

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

  const cId = (await api.v1.assembly.slider({
    id: asmId, name: 'OrigSlider',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    xOffset: 0, yOffset: 0,
  })).result

  console.log('[08] created slider id:', cId)

  // Get initial state
  const before = await api.v1.assembly.getSlider({ id: asmId, name: 'OrigSlider' })
  filewrite(before.result, 'before-update')
  await snapshot('before-update')

  // Update name
  const r1 = await api.v1.assembly.updateSlider({ id: cId, name: 'RenamedSlider' })
  console.log('[08] update name result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Verify rename
  const afterName = await api.v1.assembly.getSlider({ id: asmId, name: 'RenamedSlider' })
  console.log('[08] renamed lookup found:', afterName.result ? 'yes' : 'no')

  // Update offsets
  const r2 = await api.v1.assembly.updateSlider({ id: cId, xOffset: 20, yOffset: -10 })
  console.log('[08] update offsets result:', r2.result, 'maxLevel:', r2.maxLevel)
  await snapshot('after-offset-update')

  // Update zOffsetLimits
  const r3 = await api.v1.assembly.updateSlider({ id: cId, zOffsetLimits: { min: -15, max: 25 } })
  console.log('[08] update limits result:', r3.result, 'maxLevel:', r3.maxLevel)

  // Get final state
  const after = await api.v1.assembly.getSlider({ id: asmId, name: 'RenamedSlider' })
  filewrite(after.result, 'after-update')

  // Update flip on mate1
  const r4 = await api.v1.assembly.updateSlider({
    id: cId,
    mate1: { path: [inst1], csys: wcs1, flip: 'X' },
  })
  console.log('[08] update mate1 flip result:', r4.result, 'maxLevel:', r4.maxLevel)
  await snapshot('after-flip-update')

  const afterFlip = await api.v1.assembly.getSlider({ id: asmId, name: 'RenamedSlider' })
  filewrite(afterFlip.result, 'after-flip-update')

  return { asmId, cId }
}
