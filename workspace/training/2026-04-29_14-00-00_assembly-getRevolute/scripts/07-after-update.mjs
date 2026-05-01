export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'B1', length: 40, width: 30, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({ id: tpl1, name: 'WCS1', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'B2', length: 60, width: 20, height: 15 })
  const wcs2 = (await api.v1.part.workCSys({ id: tpl2, name: 'WCS2', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'I2' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO1', mate1: { path: [inst1], csys: wcs1 } })

  const revId = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'Rev_Update',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zOffset: 10,
  })).result

  // Read before update
  const before = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Rev_Update' })).result
  console.log('[07] before — zOffset:', before.zOffset, 'name:', before.name)

  // Update multiple properties
  await api.v1.assembly.updateRevolute({
    id: revId,
    name: 'Rev_Updated',
    zOffset: 42,
    zRotationLimits: { min: '-90deg', max: '180deg' },
    mate2: { flip: '-Z' },
  })

  // Read after update — MUST use new name
  const after = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Rev_Updated' })).result
  console.log('[07] after — zOffset:', after.zOffset, 'name:', after.name)
  console.log('[07] after — mate2.flip:', after.mate2.flip)
  console.log('[07] after — limits:', JSON.stringify(after.zRotationLimits))

  // Old name should fail
  const old = await api.v1.assembly.getRevolute({ id: asmId, name: 'Rev_Update' })
  console.log('[07] old name — result:', old.result, 'maxLevel:', old.maxLevel)

  filewrite({
    before: { name: before.name, zOffset: before.zOffset, mate2Flip: before.mate2.flip, limits: before.zRotationLimits },
    after: { name: after.name, zOffset: after.zOffset, mate2Flip: after.mate2.flip, limits: after.zRotationLimits },
    oldNameFails: old.result === null,
  }, 'after-update')

  return { asmId }
}
