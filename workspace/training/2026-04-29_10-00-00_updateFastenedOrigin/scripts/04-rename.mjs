export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'RenameTest' })).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
  })).result

  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'OriginalName',
    mate1: { path: [inst], csys: wcs },
    xOffset: 25,
  })).result
  console.log('[04] created foId:', foId)

  // Verify original name works
  const getOld = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'OriginalName' })).result
  console.log('[04] get by old name — id:', getOld?.id, 'name:', getOld?.name)

  // Rename
  const r = await api.v1.assembly.updateFastenedOrigin({ id: foId, name: 'RenamedFO' })
  console.log('[04] rename result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'rename-response')

  // Old name should fail
  const getOldAfter = await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'OriginalName' })
  console.log('[04] get by old name after rename — result:', getOldAfter.result, 'maxLevel:', getOldAfter.maxLevel)

  // New name should work
  const getNew = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'RenamedFO' })).result
  console.log('[04] get by new name — id:', getNew?.id, 'name:', getNew?.name, 'xOffset:', getNew?.xOffset)

  // Verify offset preserved through rename
  console.log('[04] xOffset preserved?', getNew?.xOffset === 25 ? '✓' : '❌')

  filewrite({
    oldNameResult: getOldAfter.result,
    oldNameMaxLevel: getOldAfter.maxLevel,
    newNameResult: getNew,
  }, 'rename-verification')

  return { foId }
}
