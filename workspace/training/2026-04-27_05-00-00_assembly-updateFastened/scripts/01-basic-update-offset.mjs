export default async function (api, { snapshot, filewrite }) {
  // Setup: assembly with two parts + WCS
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 60, width: 40, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS1', origin: [30, 20, 20],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl2, name: 'Box2', length: 20, width: 20, height: 30 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS2', origin: [10, 10, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'Block' })).result

  // Create fastened with initial offsets
  const cId = (await api.v1.assembly.fastened({
    id: asmId,
    name: 'F1',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    xOffset: 10,
    yOffset: 0,
    zOffset: 5,
  })).result
  console.log('[01] fastened created:', cId)

  await snapshot('before-update')

  // Verify initial state with getFastened
  const before = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[01] getFastened before:', JSON.stringify({ xOffset: before.xOffset, yOffset: before.yOffset, zOffset: before.zOffset }))
  filewrite(before, 'before-update')

  // Update: change xOffset from 10 to 50
  const upd = await api.v1.assembly.updateFastened({ id: cId, xOffset: 50 })
  console.log('[01] updateFastened result:', upd.result, 'maxLevel:', upd.maxLevel)
  filewrite({ result: upd.result, messages: upd.messages, maxLevel: upd.maxLevel }, 'update-response')

  await snapshot('after-update')

  // Verify updated state
  const after = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[01] getFastened after:', JSON.stringify({ xOffset: after.xOffset, yOffset: after.yOffset, zOffset: after.zOffset }))
  filewrite(after, 'after-update')

  return { cId, before, after }
}
