export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GFO_Update' })).result

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
    id: asmId,
    name: 'FO_Up',
    mate1: { path: [inst], csys: wcs },
    xOffset: 10,
    yOffset: 20,
  })).result

  // Get before update
  const before = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Up' })).result
  console.log('[09] before xOffset:', before.xOffset, 'yOffset:', before.yOffset)

  // Update
  await api.v1.assembly.updateFastenedOrigin({ id: foId, xOffset: 77, zRotation: '45deg' })

  // Get after update
  const after = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Up' })).result
  console.log('[09] after xOffset:', after.xOffset, 'yOffset:', after.yOffset, 'zRotation:', after.zRotation)

  filewrite({ before, after }, 'before-after-update')

  // Also test: update name, then get with new name
  await api.v1.assembly.updateFastenedOrigin({ id: foId, name: 'FO_Renamed' })

  const byOldName = await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Up' })
  console.log('[09] old name result:', byOldName.result, 'maxLevel:', byOldName.maxLevel)

  const byNewName = await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Renamed' })
  console.log('[09] new name result id:', byNewName.result?.id, 'maxLevel:', byNewName.maxLevel)

  filewrite({
    oldName: { result: byOldName.result, maxLevel: byOldName.maxLevel },
    newName: { result: byNewName.result, maxLevel: byNewName.maxLevel },
  }, 'rename-get')

  return { asmId }
}
