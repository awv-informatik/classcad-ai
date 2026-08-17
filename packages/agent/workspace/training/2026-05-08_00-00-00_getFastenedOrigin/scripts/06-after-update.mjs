export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
  })).result

  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Upd',
    mate1: { path: [inst], csys: wcs },
    xOffset: 10, yOffset: 20,
  })).result

  // Query before update
  const before = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Upd' })).result
  console.log('[06] before update — xOffset:', before.xOffset, 'yOffset:', before.yOffset)

  // Update
  await api.v1.assembly.updateFastenedOrigin({ id: foId, xOffset: 99, zRotation: '45deg' })

  // Query after update
  const after = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Upd' })).result
  console.log('[06] after update — xOffset:', after.xOffset, 'yOffset:', after.yOffset, 'zRotation:', after.zRotation)

  // Rename and query by new name
  await api.v1.assembly.updateFastenedOrigin({ id: foId, name: 'FO_Renamed' })
  const rOld = await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Upd' })
  const rNew = await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Renamed' })
  console.log('[06] old name after rename — result:', rOld.result, 'maxLevel:', rOld.maxLevel)
  console.log('[06] new name after rename — found:', rNew.result !== null)

  filewrite({ before, after, oldNameResult: rOld.result, newNameFound: rNew.result !== null }, 'after-update')

  return {}
}
