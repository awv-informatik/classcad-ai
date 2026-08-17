export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'DelAsm' })).result

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
    id: asmId, name: 'ToDelete',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result
  console.log('[10] created slider:', cId)

  // Verify exists
  const before = await api.v1.assembly.getSlider({ id: asmId, name: 'ToDelete' })
  console.log('[10] exists before delete:', before.result ? 'yes' : 'no')

  // Delete using ids (plural, array)
  const r1 = await api.v1.assembly.deleteConstraint({ ids: [cId] })
  console.log('[10] delete result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'delete-response')

  // Verify gone
  const after = await api.v1.assembly.getSlider({ id: asmId, name: 'ToDelete' })
  console.log('[10] exists after delete:', after.result ? 'yes' : 'no')
  console.log('[10] after delete maxLevel:', after.maxLevel)

  // Try wrong param: id (singular) instead of ids
  const cId2 = (await api.v1.assembly.slider({
    id: asmId, name: 'ToDelete2',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result
  console.log('[10] created slider 2:', cId2)

  const r2 = await api.v1.assembly.deleteConstraint({ id: cId2 })
  console.log('[10] delete with id (singular) result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[10] delete with id messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'delete-singular-id')

  return { asmId }
}
