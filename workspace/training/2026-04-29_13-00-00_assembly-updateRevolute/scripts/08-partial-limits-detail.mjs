export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'PartialLimAsm' })).result

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

  // Case 1: Start with NO limits, try to set min-only via update
  const c1 = (await api.v1.assembly.revolute({
    id: asmId, name: 'NoLimits',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result

  const before1 = (await api.v1.assembly.getRevolute({ id: asmId, name: 'NoLimits' })).result
  console.log('[08] case1 before limits:', JSON.stringify(before1.zRotationLimits))

  const r1 = await api.v1.assembly.updateRevolute({ id: c1, zRotationLimits: { min: '-90deg' } })
  console.log('[08] case1 min-only update:', r1.result, 'maxLevel:', r1.maxLevel, 'msgs:', JSON.stringify(r1.messages))

  const after1 = (await api.v1.assembly.getRevolute({ id: asmId, name: 'NoLimits' })).result
  console.log('[08] case1 after limits:', JSON.stringify(after1.zRotationLimits))

  // Case 2: Start WITH limits, try max-only update
  await api.v1.assembly.deleteConstraint({ ids: [c1] })
  const c2 = (await api.v1.assembly.revolute({
    id: asmId, name: 'WithLimits',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zRotationLimits: { min: '-45deg', max: '90deg' },
  })).result

  const before2 = (await api.v1.assembly.getRevolute({ id: asmId, name: 'WithLimits' })).result
  console.log('[08] case2 before limits:', JSON.stringify(before2.zRotationLimits))

  // Update max-only
  const r2 = await api.v1.assembly.updateRevolute({ id: c2, zRotationLimits: { max: '180deg' } })
  console.log('[08] case2 max-only update:', r2.result, 'maxLevel:', r2.maxLevel)

  const after2 = (await api.v1.assembly.getRevolute({ id: asmId, name: 'WithLimits' })).result
  console.log('[08] case2 after limits:', JSON.stringify(after2.zRotationLimits))
  console.log('[08] case2 min preserved?', after2.zRotationLimits.min === before2.zRotationLimits.min)

  // Update min-only
  const r3 = await api.v1.assembly.updateRevolute({ id: c2, zRotationLimits: { min: '-120deg' } })
  console.log('[08] case2 min-only update:', r3.result, 'maxLevel:', r3.maxLevel)

  const after3 = (await api.v1.assembly.getRevolute({ id: asmId, name: 'WithLimits' })).result
  console.log('[08] case2 after min-only:', JSON.stringify(after3.zRotationLimits))
  console.log('[08] case2 max preserved?', after3.zRotationLimits.max === after2.zRotationLimits.max)

  filewrite({ case1: { before: before1.zRotationLimits, after: after1.zRotationLimits },
    case2: { before: before2.zRotationLimits, afterMaxOnly: after2.zRotationLimits, afterMinOnly: after3.zRotationLimits }
  }, 'partial-limits-detail')

  return { c2 }
}
