export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 60, width: 40, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS1', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl2, name: 'Box2', length: 20, width: 20, height: 20 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS2', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'Block' })).result

  const cId = (await api.v1.assembly.fastened({
    id: asmId, name: 'OriginalName',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    xOffset: 30,
  })).result
  console.log('[03] created:', cId)

  // Verify original name
  const before = (await api.v1.assembly.getFastened({ id: asmId, name: 'OriginalName' })).result
  console.log('[03] before name:', before.name)

  // Update name
  const r = await api.v1.assembly.updateFastened({ id: cId, name: 'RenamedConstraint' })
  console.log('[03] update name result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'name-update-response')

  // Try getFastened with old name — should fail (VOID)
  const oldName = await api.v1.assembly.getFastened({ id: asmId, name: 'OriginalName' })
  console.log('[03] old name lookup result:', oldName.result, 'maxLevel:', oldName.maxLevel)

  // Try getFastened with new name — should succeed
  const newName = await api.v1.assembly.getFastened({ id: asmId, name: 'RenamedConstraint' })
  console.log('[03] new name lookup result:', newName.result?.name, 'id:', newName.result?.id)
  filewrite({ oldNameResult: oldName.result, newNameResult: newName.result }, 'name-lookup')

  return { cId }
}
