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

  // Revolute with NO limits
  const revId = (await api.v1.assembly.revolute({
    id: asmId, name: 'NoLimits',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })).result

  const r = await api.v1.assembly.getRevolute({ id: asmId, name: 'NoLimits' })
  console.log('[07] zRotationLimits:', JSON.stringify(r.result?.zRotationLimits))
  console.log('[07] limits is null?', r.result?.zRotationLimits === null)
  console.log('[07] limits.min:', r.result?.zRotationLimits?.min)
  console.log('[07] limits.max:', r.result?.zRotationLimits?.max)

  filewrite(r.result, 'no-limits')

  // Revolute with non-default flip and reorient
  const tplD = (await api.v1.assembly.partTemplate({ name: 'Arm2' })).result
  await api.v1.part.box({ id: tplD, name: 'Box', length: 50, width: 15, height: 6 })
  const wcsD = (await api.v1.part.workCSys({ id: tplD, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst3 = (await api.v1.assembly.instance({ productId: tplD, ownerId: asmId, name: 'Arm2' })).result

  const rev2Id = (await api.v1.assembly.revolute({
    id: asmId, name: 'WithFlip',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst3], csys: wcsD, flip: '-Z', reorient: '180' },
    zOffset: 5,
    zRotationLimits: { min: 0, max: 0 },
  })).result

  const r2 = await api.v1.assembly.getRevolute({ id: asmId, name: 'WithFlip' })
  console.log('[07] flip returned:', r2.result?.mate2?.flip)
  console.log('[07] reorient returned:', r2.result?.mate2?.reorient)
  console.log('[07] limits with locked:', JSON.stringify(r2.result?.zRotationLimits))

  filewrite(r2.result, 'with-flip-reorient')

  return { revId, rev2Id }
}
