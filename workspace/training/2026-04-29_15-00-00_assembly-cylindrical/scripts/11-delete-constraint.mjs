export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'CylDelAsm' })).result

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

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'BaseInst' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'RodInst' })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO1', mate1: { path: [inst1], csys: wcs1 } })

  const c1 = (await api.v1.assembly.cylindrical({
    id: asmId, name: 'DelTest1',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result

  const c2 = (await api.v1.assembly.cylindrical({
    id: asmId, name: 'DelTest2',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result

  console.log('[11] created:', c1, c2)

  // Delete with ids (correct way)
  const d1 = await api.v1.assembly.deleteConstraint({ ids: [c1] })
  console.log('[11] delete c1:', d1.result, 'maxLevel:', d1.maxLevel)

  // Verify deleted
  const g1 = await api.v1.assembly.getCylindrical({ id: asmId, name: 'DelTest1' })
  console.log('[11] c1 after delete:', g1.result, 'maxLevel:', g1.maxLevel)

  // c2 still exists
  const g2 = await api.v1.assembly.getCylindrical({ id: asmId, name: 'DelTest2' })
  console.log('[11] c2 still exists:', g2.result?.id)

  // Error: use id instead of ids
  const d2 = await api.v1.assembly.deleteConstraint({ id: c2 })
  console.log('[11] wrong param (id):', d2.result, 'maxLevel:', d2.maxLevel, 'msg:', d2.messages?.[0]?.message)

  // Batch delete
  const c3 = (await api.v1.assembly.cylindrical({
    id: asmId, name: 'DelTest3',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result
  const d3 = await api.v1.assembly.deleteConstraint({ ids: [c2, c3] })
  console.log('[11] batch delete:', d3.result, 'maxLevel:', d3.maxLevel)

  const g3 = await api.v1.assembly.getCylindrical({ id: asmId, name: 'DelTest2' })
  const g4 = await api.v1.assembly.getCylindrical({ id: asmId, name: 'DelTest3' })
  console.log('[11] c2 after batch:', g3.result, 'c3 after batch:', g4.result)

  filewrite({
    deleteOne: { result: d1.result, maxLevel: d1.maxLevel },
    wrongParam: { result: d2.result, maxLevel: d2.maxLevel, msg: d2.messages },
    batchDelete: { result: d3.result, maxLevel: d3.maxLevel },
  }, 'delete-results')

  return { asmId }
}
