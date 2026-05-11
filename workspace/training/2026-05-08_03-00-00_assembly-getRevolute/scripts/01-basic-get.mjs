export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm', transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  const revId = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'Hinge1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 15,
    zRotationLimits: { min: '-45deg', max: '90deg' },
  })).result

  console.log('[01] revolute created, id:', revId)

  const r = await api.v1.assembly.getRevolute({ id: asmId, name: 'Hinge1' })
  console.log('[01] getRevolute maxLevel:', r.maxLevel)
  console.log('[01] getRevolute result.id:', r.result?.id)
  console.log('[01] getRevolute result.name:', r.result?.name)
  console.log('[01] getRevolute result.zOffset:', r.result?.zOffset)
  console.log('[01] getRevolute result.zRotationLimits:', JSON.stringify(r.result?.zRotationLimits))
  console.log('[01] getRevolute result.mate1.path:', JSON.stringify(r.result?.mate1?.path))
  console.log('[01] getRevolute result.mate1.csys:', r.result?.mate1?.csys)
  console.log('[01] getRevolute result.mate1.flip:', r.result?.mate1?.flip)
  console.log('[01] getRevolute result.mate1.reorient:', r.result?.mate1?.reorient)
  console.log('[01] getRevolute result.mate2.path:', JSON.stringify(r.result?.mate2?.path))
  console.log('[01] getRevolute result.mate2.csys:', r.result?.mate2?.csys)
  console.log('[01] getRevolute result.mate2.flip:', r.result?.mate2?.flip)
  console.log('[01] getRevolute result.mate2.reorient:', r.result?.mate2?.reorient)

  filewrite(r.result, 'getRevolute-result')

  // Verify returned ID matches created ID
  console.log('[01] id match:', r.result?.id === revId ? '✓' : `❌ expected ${revId} got ${r.result?.id}`)

  await snapshot('after-revolute')
  return { revId, asmId }
}
