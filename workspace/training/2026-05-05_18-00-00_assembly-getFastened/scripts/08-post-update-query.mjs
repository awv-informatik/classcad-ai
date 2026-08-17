export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'P' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'M', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId,
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create constraint
  const fId = (await api.v1.assembly.fastened({
    id: asmId, name: 'Updatable',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    xOffset: 50,
  })).result

  // Query before update
  const before = await api.v1.assembly.getFastened({ id: asmId, name: 'Updatable' })
  console.log('[08] before update xOffset:', before.result?.xOffset, 'zRotation:', before.result?.zRotation)

  // Update offset and rotation
  await api.v1.assembly.updateFastened({ id: fId, xOffset: 100, zRotation: '45deg' })

  // Query after update
  const after = await api.v1.assembly.getFastened({ id: asmId, name: 'Updatable' })
  console.log('[08] after update xOffset:', after.result?.xOffset, 'zRotation:', after.result?.zRotation)
  filewrite({ before: before.result, after: after.result }, 'before-after-update')

  // Rename via update, then query by new name
  await api.v1.assembly.updateFastened({ id: fId, name: 'Renamed' })

  const byOld = await api.v1.assembly.getFastened({ id: asmId, name: 'Updatable' })
  console.log('[08] query old name after rename maxLevel:', byOld.maxLevel, 'result:', byOld.result)

  const byNew = await api.v1.assembly.getFastened({ id: asmId, name: 'Renamed' })
  console.log('[08] query new name after rename maxLevel:', byNew.maxLevel, 'result id:', byNew.result?.id)
  console.log('[08] new name xOffset preserved?', byNew.result?.xOffset)
  console.log('[08] new name zRotation preserved?', byNew.result?.zRotation)

  return { asmId }
}
