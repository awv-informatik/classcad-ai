export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'CylUpdateNM' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 50, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Axis1', origin: [40, 25, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Rod' })).result
  await api.v1.part.box({ id: tpl2, name: 'Rod', length: 10, width: 10, height: 60 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Axis2', origin: [5, 5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'NewRod' })).result
  await api.v1.part.box({ id: tpl3, name: 'NewRod', length: 12, width: 12, height: 50 })
  const wcs3 = (await api.v1.part.workCSys({
    id: tpl3, name: 'Axis3', origin: [6, 6, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'BaseInst' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'RodInst' })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl3, ownerId: asmId, name: 'NewRodInst' })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO1', mate1: { path: [inst1], csys: wcs1 } })

  const cId = (await api.v1.assembly.cylindrical({
    id: asmId, name: 'OrigName',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result
  console.log('[08] created:', cId)

  // Update name
  const u1 = await api.v1.assembly.updateCylindrical({ id: cId, name: 'RenamedCyl' })
  console.log('[08] rename:', u1.result, 'maxLevel:', u1.maxLevel)

  // Old name should fail
  const g1 = await api.v1.assembly.getCylindrical({ id: asmId, name: 'OrigName' })
  console.log('[08] old name get:', g1.result, 'maxLevel:', g1.maxLevel)

  // New name should work
  const g2 = await api.v1.assembly.getCylindrical({ id: asmId, name: 'RenamedCyl' })
  console.log('[08] new name get:', g2.result?.id, g2.result?.name)

  // Update mate flip
  const u2 = await api.v1.assembly.updateCylindrical({ id: cId, mate2: { flip: '-Z' } })
  console.log('[08] update flip:', u2.result, 'maxLevel:', u2.maxLevel)
  const g3 = (await api.v1.assembly.getCylindrical({ id: asmId, name: 'RenamedCyl' })).result
  console.log('[08] mate2 after flip update:', g3.mate2.flip, 'path preserved:', JSON.stringify(g3.mate2.path))

  // Update mate reorient
  const u3 = await api.v1.assembly.updateCylindrical({ id: cId, mate1: { reorient: '180' } })
  console.log('[08] update reorient:', u3.result, 'maxLevel:', u3.maxLevel)
  const g4 = (await api.v1.assembly.getCylindrical({ id: asmId, name: 'RenamedCyl' })).result
  console.log('[08] mate1 after reorient:', g4.mate1.reorient, 'flip preserved:', g4.mate1.flip)

  // Retarget mate2 to inst3
  const u4 = await api.v1.assembly.updateCylindrical({ id: cId, mate2: { path: [inst3], csys: wcs3 } })
  console.log('[08] retarget:', u4.result, 'maxLevel:', u4.maxLevel)
  const g5 = (await api.v1.assembly.getCylindrical({ id: asmId, name: 'RenamedCyl' })).result
  console.log('[08] mate2 after retarget:', JSON.stringify(g5.mate2.path), 'csys:', g5.mate2.csys)

  // Error: use assembly ID instead of constraint ID
  const u5 = await api.v1.assembly.updateCylindrical({ id: asmId, name: 'WrongId' })
  console.log('[08] asm ID error:', u5.result, 'maxLevel:', u5.maxLevel, 'msg:', u5.messages?.[0]?.message)

  filewrite({
    rename: { oldName: g1.result, newName: { id: g2.result?.id, name: g2.result?.name } },
    flipUpdate: { flip: g3.mate2.flip, pathPreserved: g3.mate2.path },
    reorientUpdate: { reorient: g4.mate1.reorient, flipPreserved: g4.mate1.flip },
    retarget: { path: g5.mate2.path, csys: g5.mate2.csys },
    asmIdError: { result: u5.result, maxLevel: u5.maxLevel, msg: u5.messages },
  }, 'update-name-mates')

  return { asmId }
}
