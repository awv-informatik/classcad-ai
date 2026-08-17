export default async function (api, { snapshot, filewrite }) {
  // Test updateFastened: modify offsets, rotations, verify partial update
  const asmId = (await api.v1.assembly.create({})).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 80, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'O', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Ref' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Moved',
    transformation: [[150, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create with xOffset=50
  const fId = (await api.v1.assembly.fastened({
    id: asmId, name: 'F_Update',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    xOffset: 50,
  })).result
  console.log('[10] created fastened id:', fId)

  await api.v1.common.recalc({})
  const mass1 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[10] COG after create (xOffset=50):', JSON.stringify(mass1?.cog))

  // Update: change xOffset to 100
  const r1 = await api.v1.assembly.updateFastened({ id: fId, xOffset: 100 })
  console.log('[10] update xOffset=100:', r1.result, 'maxLevel:', r1.maxLevel)

  await api.v1.common.recalc({})
  const mass2 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[10] COG after update xOffset=100:', JSON.stringify(mass2?.cog))

  // Verify: does yOffset stay at 0 (preserved) or reset?
  const get1 = await api.v1.assembly.getFastened({ id: asmId, name: 'F_Update' })
  console.log('[10] after update xOffset only:', JSON.stringify({
    xOffset: get1.result?.xOffset,
    yOffset: get1.result?.yOffset,
    zOffset: get1.result?.zOffset,
  }))

  // Update: add yOffset=30, leave xOffset
  const r2 = await api.v1.assembly.updateFastened({ id: fId, yOffset: 30 })
  console.log('[10] update yOffset=30:', r2.result, 'maxLevel:', r2.maxLevel)

  const get2 = await api.v1.assembly.getFastened({ id: asmId, name: 'F_Update' })
  console.log('[10] after update yOffset only:', JSON.stringify({
    xOffset: get2.result?.xOffset,
    yOffset: get2.result?.yOffset,
    zOffset: get2.result?.zOffset,
  }))

  await api.v1.common.recalc({})
  const mass3 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[10] COG after update yOffset=30:', JSON.stringify(mass3?.cog))

  // Update: add zRotation
  const r3 = await api.v1.assembly.updateFastened({ id: fId, zRotation: '45deg' })
  console.log('[10] update zRotation=45deg:', r3.result, 'maxLevel:', r3.maxLevel)

  await api.v1.common.recalc({})
  await snapshot('after-all-updates')

  const get3 = await api.v1.assembly.getFastened({ id: asmId, name: 'F_Update' })
  filewrite(get3.result, 'final-state')

  filewrite({ mass1, mass2, mass3 }, 'mass-progression')

  return { fId }
}
