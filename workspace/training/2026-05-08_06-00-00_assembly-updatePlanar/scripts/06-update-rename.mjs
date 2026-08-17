export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 100, width: 80, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Slider' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Slider' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  const planarId = (await api.v1.assembly.planar({
    id: asmId,
    name: 'OldName',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 15,
  })).result

  // Verify name via getPlanar
  const getOld = await api.v1.assembly.getPlanar({ id: asmId, name: 'OldName' })
  console.log('[06] getPlanar OldName found:', getOld.result !== null)

  // Rename
  const r = await api.v1.assembly.updatePlanar({ id: planarId, name: 'NewName' })
  console.log('[06] rename result:', r.result, 'maxLevel:', r.maxLevel)

  // Old name should no longer find it
  const getOldAfter = await api.v1.assembly.getPlanar({ id: asmId, name: 'OldName' })
  console.log('[06] getPlanar OldName after rename:', getOldAfter.result)

  // New name should find it
  const getNew = await api.v1.assembly.getPlanar({ id: asmId, name: 'NewName' })
  console.log('[06] getPlanar NewName found:', getNew.result !== null)
  console.log('[06] getPlanar NewName name field:', getNew.result?.name)

  filewrite({
    planarId,
    renameResult: r.result,
    oldNameAfterRename: getOldAfter.result,
    newNameResult: getNew.result ? { id: getNew.result.id, name: getNew.result.name, zOffset: getNew.result.zOffset } : null,
  }, 'rename')

  return { planarId }
}
