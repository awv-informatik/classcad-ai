export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'IndivLimAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'A' })).result
  await api.v1.part.box({ id: tpl1, length: 50, width: 40, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'W', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'B' })).result
  await api.v1.part.box({ id: tpl2, length: 30, width: 30, height: 30 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'W', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'I2' })).result

  // Create with both limits
  const cId = (await api.v1.assembly.revolute({
    id: asmId, name: 'IndivLim',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zRotationLimits: { min: '-90deg', max: '90deg' },
  })).result

  const before = (await api.v1.assembly.getRevolute({ id: asmId, name: 'IndivLim' })).result
  console.log('[09] before:', JSON.stringify(before.zRotationLimits))

  // Remove just max by setting to null
  const r1 = await api.v1.assembly.updateRevolute({ id: cId, zRotationLimits: { max: null } })
  console.log('[09] remove max (null):', r1.result, 'maxLevel:', r1.maxLevel)

  const after1 = (await api.v1.assembly.getRevolute({ id: asmId, name: 'IndivLim' })).result
  console.log('[09] after remove max:', JSON.stringify(after1.zRotationLimits))

  // Re-add max
  await api.v1.assembly.updateRevolute({ id: cId, zRotationLimits: { max: '120deg' } })

  // Remove just min by setting to null
  const r2 = await api.v1.assembly.updateRevolute({ id: cId, zRotationLimits: { min: null } })
  console.log('[09] remove min (null):', r2.result, 'maxLevel:', r2.maxLevel)

  const after2 = (await api.v1.assembly.getRevolute({ id: asmId, name: 'IndivLim' })).result
  console.log('[09] after remove min:', JSON.stringify(after2.zRotationLimits))

  // Remove both via null on the whole object
  await api.v1.assembly.updateRevolute({ id: cId, zRotationLimits: { min: '-45deg', max: '45deg' } })
  const r3 = await api.v1.assembly.updateRevolute({ id: cId, zRotationLimits: null })
  const after3 = (await api.v1.assembly.getRevolute({ id: asmId, name: 'IndivLim' })).result
  console.log('[09] after null object:', JSON.stringify(after3.zRotationLimits))

  filewrite({ before: before.zRotationLimits, afterRemoveMax: after1.zRotationLimits,
    afterRemoveMin: after2.zRotationLimits, afterNullAll: after3.zRotationLimits }, 'individual-limit-remove')

  return { cId }
}
