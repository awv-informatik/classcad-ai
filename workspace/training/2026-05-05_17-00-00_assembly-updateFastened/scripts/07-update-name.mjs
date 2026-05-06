export default async function (api, { snapshot, filewrite }) {
  // Setup
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 80, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Inst1' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst2',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create fastened with original name
  const fId = (await api.v1.assembly.fastened({
    id: asmId, name: 'OriginalName',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    xOffset: 50,
  })).result
  console.log('[07] created with name "OriginalName":', fId)

  // Verify findable by original name
  const r1 = await api.v1.assembly.getFastened({ id: asmId, name: 'OriginalName' })
  console.log('[07] found by "OriginalName":', r1.result?.id, 'maxLevel:', r1.maxLevel)

  // Update name
  const r2 = await api.v1.assembly.updateFastened({ id: fId, name: 'RenamedConstraint' })
  console.log('[07] updateFastened name change:', r2.result, 'maxLevel:', r2.maxLevel)

  // Try to find by old name
  const r3 = await api.v1.assembly.getFastened({ id: asmId, name: 'OriginalName' })
  console.log('[07] find by old name "OriginalName":', r3.result, 'maxLevel:', r3.maxLevel)

  // Find by new name
  const r4 = await api.v1.assembly.getFastened({ id: asmId, name: 'RenamedConstraint' })
  console.log('[07] find by new name "RenamedConstraint":', r4.result?.id, 'maxLevel:', r4.maxLevel)

  // Verify offsets preserved after rename
  console.log('[07] xOffset after rename:', r4.result?.xOffset)

  filewrite({ oldNameResult: r3.result, newNameResult: r4.result }, 'name-lookup-results')

  return { fId }
}
