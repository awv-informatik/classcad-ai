export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'RevLimitsTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 50, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS', origin: [40, 25, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'Arm', length: 10, width: 30, height: 70 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS', origin: [5, 15, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BaseInst',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'ArmInst',
  })).result

  // Test 1: zRotationLimits with degree expressions
  const r1 = await api.v1.assembly.revolute({
    id: asmId,
    name: 'DegLimits',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zRotationLimits: { min: '-90deg', max: '90deg' },
  })
  console.log('[05] deg limits result:', r1.result, 'maxLevel:', r1.maxLevel)
  const g1 = await api.v1.assembly.getRevolute({ id: asmId, name: 'DegLimits' })
  filewrite(g1.result, 'deg-limits')
  console.log('[05] deg limits stored min:', g1.result.zRotationLimits.min, 'max:', g1.result.zRotationLimits.max)

  // Delete and test 2: radians directly
  await api.v1.assembly.deleteConstraint({ id: r1.result })

  const r2 = await api.v1.assembly.revolute({
    id: asmId,
    name: 'RadLimits',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zRotationLimits: { min: -Math.PI / 4, max: Math.PI / 2 },
  })
  console.log('[05] rad limits result:', r2.result, 'maxLevel:', r2.maxLevel)
  const g2 = await api.v1.assembly.getRevolute({ id: asmId, name: 'RadLimits' })
  filewrite(g2.result, 'rad-limits')
  console.log('[05] rad limits stored min:', g2.result.zRotationLimits.min, 'max:', g2.result.zRotationLimits.max)

  // Delete and test 3: no limits (default)
  await api.v1.assembly.deleteConstraint({ id: r2.result })

  const r3 = await api.v1.assembly.revolute({
    id: asmId,
    name: 'NoLimits',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })
  const g3 = await api.v1.assembly.getRevolute({ id: asmId, name: 'NoLimits' })
  filewrite(g3.result, 'no-limits')
  console.log('[05] no limits stored:', JSON.stringify(g3.result.zRotationLimits))

  // Test 4: min-only limit (max = VOID/null)
  await api.v1.assembly.deleteConstraint({ id: r3.result })

  const r4 = await api.v1.assembly.revolute({
    id: asmId,
    name: 'MinOnly',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zRotationLimits: { min: '-45deg' },
  })
  console.log('[05] min-only result:', r4.result, 'maxLevel:', r4.maxLevel)
  const g4 = await api.v1.assembly.getRevolute({ id: asmId, name: 'MinOnly' })
  filewrite(g4.result, 'min-only-limits')
  console.log('[05] min-only stored:', JSON.stringify(g4.result.zRotationLimits))

  await snapshot('limits-test')

  return { asmId }
}
