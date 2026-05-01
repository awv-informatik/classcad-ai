export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'PlanarUpdate' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 100, width: 80, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Ref', origin: [50, 40, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Slider' })).result
  await api.v1.part.box({ id: tpl2, name: 'Block', length: 30, width: 30, height: 20 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Ref', origin: [15, 15, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result

  // Create minimal planar
  const cId = (await api.v1.assembly.planar({
    id: asmId,
    name: 'UpdateMe',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result

  console.log('[06] created cId:', cId)

  // Update zOffset
  const r1 = await api.v1.assembly.updatePlanar({ id: cId, zOffset: 30 })
  console.log('[06] updatePlanar zOffset=30:', r1.result, 'maxLevel:', r1.maxLevel)

  // Update name
  const r2 = await api.v1.assembly.updatePlanar({ id: cId, name: 'UpdatedPlanar' })
  console.log('[06] updatePlanar name:', r2.result, 'maxLevel:', r2.maxLevel)

  // Update xOffsetLimits
  const r3 = await api.v1.assembly.updatePlanar({ id: cId, xOffsetLimits: { min: -30, max: 30 } })
  console.log('[06] updatePlanar xOffsetLimits:', r3.result, 'maxLevel:', r3.maxLevel)

  // Update yOffsetLimits
  const r4 = await api.v1.assembly.updatePlanar({ id: cId, yOffsetLimits: { min: 0, max: 50 } })
  console.log('[06] updatePlanar yOffsetLimits:', r4.result, 'maxLevel:', r4.maxLevel)

  // Update zRotationLimits
  const r5 = await api.v1.assembly.updatePlanar({ id: cId, zRotationLimits: { min: '-90deg', max: '90deg' } })
  console.log('[06] updatePlanar zRotationLimits:', r5.result, 'maxLevel:', r5.maxLevel)

  // Partial zRotationLimits on update — should work (based on revolute/cylindrical pattern)
  const r6 = await api.v1.assembly.updatePlanar({ id: cId, zRotationLimits: { max: '180deg' } })
  console.log('[06] updatePlanar partial zRotationLimits (max-only):', r6.result, 'maxLevel:', r6.maxLevel)
  if (r6.messages?.length) console.log('[06] partial zRot update msgs:', JSON.stringify(r6.messages))

  // Remove limits by setting to null
  const r7 = await api.v1.assembly.updatePlanar({ id: cId, xOffsetLimits: null })
  console.log('[06] updatePlanar xOffsetLimits=null:', r7.result, 'maxLevel:', r7.maxLevel)

  const r8 = await api.v1.assembly.updatePlanar({ id: cId, zRotationLimits: null })
  console.log('[06] updatePlanar zRotationLimits=null:', r8.result, 'maxLevel:', r8.maxLevel)

  // Verify final state
  const get = await api.v1.assembly.getPlanar({ id: asmId, name: 'UpdatedPlanar' })
  console.log('[06] final getPlanar:', JSON.stringify(get.result))
  filewrite(get.result, 'update-final-state')

  await snapshot('updated-planar')
  return { cId }
}
