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

  // Create with degree strings for zRotationLimits
  await api.v1.assembly.revolute({
    id: asmId,
    name: 'Rev_Deg',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zOffset: 15,
    zRotationLimits: { min: '-45deg', max: '90deg' },
  })

  const r = await api.v1.assembly.getRevolute({ id: asmId, name: 'Rev_Deg' })
  const res = r.result

  console.log('[03] zOffset:', res.zOffset, typeof res.zOffset)
  console.log('[03] zRotationLimits.min:', res.zRotationLimits.min, typeof res.zRotationLimits.min)
  console.log('[03] zRotationLimits.max:', res.zRotationLimits.max, typeof res.zRotationLimits.max)
  console.log('[03] expected min (-45deg in rad):', -Math.PI / 4)
  console.log('[03] expected max (90deg in rad):', Math.PI / 2)
  console.log('[03] min match:', Math.abs(res.zRotationLimits.min - (-Math.PI / 4)) < 1e-10)
  console.log('[03] max match:', Math.abs(res.zRotationLimits.max - Math.PI / 2) < 1e-10)

  filewrite({
    zOffset: res.zOffset,
    zRotationLimits: res.zRotationLimits,
    minIsNumber: typeof res.zRotationLimits.min === 'number',
    maxIsNumber: typeof res.zRotationLimits.max === 'number',
  }, 'degree-readback')

  return { asmId }
}
