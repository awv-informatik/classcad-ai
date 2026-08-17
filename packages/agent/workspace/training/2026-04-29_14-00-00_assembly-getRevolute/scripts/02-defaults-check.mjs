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

  // Create revolute with ONLY required params (no optional overrides)
  await api.v1.assembly.revolute({
    id: asmId,
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })

  // Default name is "Revolute"
  const r = await api.v1.assembly.getRevolute({ id: asmId, name: 'Revolute' })
  console.log('[02] getRevolute defaults result:', JSON.stringify(r.result))
  console.log('[02] maxLevel:', r.maxLevel)

  const res = r.result
  console.log('[02] name:', res.name)
  console.log('[02] mate1.flip:', res.mate1.flip, typeof res.mate1.flip)
  console.log('[02] mate1.reorient:', res.mate1.reorient, typeof res.mate1.reorient)
  console.log('[02] mate2.flip:', res.mate2.flip, typeof res.mate2.flip)
  console.log('[02] mate2.reorient:', res.mate2.reorient, typeof res.mate2.reorient)
  console.log('[02] zOffset:', res.zOffset, typeof res.zOffset)
  console.log('[02] zRotationLimits:', JSON.stringify(res.zRotationLimits))
  console.log('[02] zRotationLimits.min type:', typeof res.zRotationLimits?.min)
  console.log('[02] zRotationLimits.max type:', typeof res.zRotationLimits?.max)

  filewrite({
    name: res.name,
    mate1Flip: res.mate1.flip,
    mate1Reorient: res.mate1.reorient,
    mate2Flip: res.mate2.flip,
    mate2Reorient: res.mate2.reorient,
    zOffset: res.zOffset,
    zRotationLimits: res.zRotationLimits,
    allKeysPresent: {
      hasId: 'id' in res,
      hasName: 'name' in res,
      hasMate1: 'mate1' in res,
      hasMate2: 'mate2' in res,
      hasZOffset: 'zOffset' in res,
      hasZRotationLimits: 'zRotationLimits' in res,
    },
  }, 'defaults')

  return { asmId }
}
