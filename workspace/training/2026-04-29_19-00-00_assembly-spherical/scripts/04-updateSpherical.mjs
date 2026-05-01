export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'UpdateSphericalTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 60, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Socket', origin: [40, 30, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'Rod', length: 10, width: 10, height: 60 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Joint', origin: [5, 5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const wcs3 = (await api.v1.part.workCSys({
    id: tpl2, name: 'AltJoint', origin: [5, 5, 60],
    xDirection: [0, 1, 0], yDirection: [0, 0, 1],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })

  // Create initial constraint
  const cId = (await api.v1.assembly.spherical({
    id: asmId,
    name: 'Ball1',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result
  console.log('[04] created:', cId)

  // Update name
  const r1 = await api.v1.assembly.updateSpherical({ id: cId, name: 'RenamedBall' })
  console.log('[04] update name:', r1.result, 'maxLevel:', r1.maxLevel)

  // Verify name changed
  const g1 = await api.v1.assembly.getSpherical({ id: asmId, name: 'RenamedBall' })
  console.log('[04] get renamed:', g1.result ? g1.result.id : 'NOT FOUND')

  // Update yRotationLimits (add limits)
  const r2 = await api.v1.assembly.updateSpherical({ id: cId, yRotationLimits: { max: '90deg' } })
  console.log('[04] update add limits:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages }, 'update-add-limits')

  // Verify limits
  const g2 = await api.v1.assembly.getSpherical({ id: asmId, name: 'RenamedBall' })
  console.log('[04] yRotationLimits after add:', JSON.stringify(g2.result?.yRotationLimits))

  // Update yRotationLimits to different value
  const r3 = await api.v1.assembly.updateSpherical({ id: cId, yRotationLimits: { max: 1.57 } })
  console.log('[04] update change limits:', r3.result, 'maxLevel:', r3.maxLevel)
  const g3 = await api.v1.assembly.getSpherical({ id: asmId, name: 'RenamedBall' })
  console.log('[04] yRotationLimits after change:', JSON.stringify(g3.result?.yRotationLimits))

  // Remove limits with null
  const r4 = await api.v1.assembly.updateSpherical({ id: cId, yRotationLimits: null })
  console.log('[04] update remove limits (null):', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'update-remove-limits')

  const g4 = await api.v1.assembly.getSpherical({ id: asmId, name: 'RenamedBall' })
  console.log('[04] yRotationLimits after remove:', JSON.stringify(g4.result?.yRotationLimits))

  // Update mate2 csys
  const r5 = await api.v1.assembly.updateSpherical({ id: cId, mate2: { path: [inst2], csys: wcs3 } })
  console.log('[04] update mate2 csys:', r5.result, 'maxLevel:', r5.maxLevel)

  await snapshot('update-test')
  filewrite(g4.result, 'final-state')

  return { asmId }
}
