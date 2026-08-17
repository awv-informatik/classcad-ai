export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  const revId = (await api.v1.assembly.revolute({
    id: asmId, name: 'MyRev',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 0,
  })).result

  // Get state before update
  const before = await api.v1.assembly.getRevolute({ id: asmId, name: 'MyRev' })
  console.log('[03] before zOffset:', before.result?.zOffset)
  console.log('[03] before zRotationLimits:', JSON.stringify(before.result?.zRotationLimits))
  console.log('[03] before mate2 flip:', before.result?.mate2?.flip)

  // Update multiple params
  await api.v1.assembly.updateRevolute({
    id: revId,
    name: 'RenamedRev',
    zOffset: 25,
    zRotationLimits: { min: '-30deg', max: '60deg' },
    mate2: { flip: '-Z' },
  })

  // Get state after update — must use new name
  const after = await api.v1.assembly.getRevolute({ id: asmId, name: 'RenamedRev' })
  console.log('[03] after name:', after.result?.name)
  console.log('[03] after zOffset:', after.result?.zOffset)
  console.log('[03] after zRotationLimits:', JSON.stringify(after.result?.zRotationLimits))
  console.log('[03] after mate2 flip:', after.result?.mate2?.flip)

  filewrite({ before: before.result, after: after.result }, 'before-after-update')

  // Verify old name is gone
  const oldName = await api.v1.assembly.getRevolute({ id: asmId, name: 'MyRev' })
  console.log('[03] old name result:', oldName.result)
  console.log('[03] old name maxLevel:', oldName.maxLevel)

  return { revId }
}
