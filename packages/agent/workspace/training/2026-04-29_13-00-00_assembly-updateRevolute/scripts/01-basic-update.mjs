export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'UpdateRevAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 50, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Hinge', origin: [40, 25, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'Arm', length: 10, width: 30, height: 60 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Hinge', origin: [5, 15, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'BaseInst' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'ArmInst' })).result

  // Create revolute with defaults
  const cId = (await api.v1.assembly.revolute({
    id: asmId, name: 'TestRev',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result
  console.log('[01] created revolute:', cId)

  // Read initial state
  const before = (await api.v1.assembly.getRevolute({ id: asmId, name: 'TestRev' })).result
  filewrite(before, 'before')
  console.log('[01] before:', JSON.stringify({ name: before.name, zOffset: before.zOffset, limits: before.zRotationLimits }))

  // Update name
  const r1 = await api.v1.assembly.updateRevolute({ id: cId, name: 'Renamed' })
  console.log('[01] update name:', r1.result, 'maxLevel:', r1.maxLevel)

  // Verify name changed
  const afterName = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Renamed' })).result
  console.log('[01] name after:', afterName?.name)

  // Old name no longer findable
  const oldName = await api.v1.assembly.getRevolute({ id: asmId, name: 'TestRev' })
  console.log('[01] old name lookup:', oldName.result, 'maxLevel:', oldName.maxLevel)

  // Update zOffset
  const r2 = await api.v1.assembly.updateRevolute({ id: cId, zOffset: 15 })
  console.log('[01] update zOffset:', r2.result, 'maxLevel:', r2.maxLevel)

  const afterOffset = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Renamed' })).result
  console.log('[01] zOffset after:', afterOffset.zOffset, 'name preserved:', afterOffset.name)

  // Update zRotationLimits with degree expressions
  const r3 = await api.v1.assembly.updateRevolute({ id: cId, zRotationLimits: { min: '-45deg', max: '90deg' } })
  console.log('[01] update limits:', r3.result, 'maxLevel:', r3.maxLevel)

  const afterLimits = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Renamed' })).result
  console.log('[01] limits after:', JSON.stringify(afterLimits.zRotationLimits))
  console.log('[01] name preserved:', afterLimits.name, 'zOffset preserved:', afterLimits.zOffset)

  filewrite(afterLimits, 'after-all-updates')
  await snapshot('after-updates')

  return { cId, asmId }
}
