export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'CylRotAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 50, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Axis1', origin: [40, 25, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Rod' })).result
  await api.v1.part.box({ id: tpl2, name: 'Rod', length: 10, width: 10, height: 60 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Axis2', origin: [5, 5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'BaseInst' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'RodInst' })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO1', mate1: { path: [inst1], csys: wcs1 } })

  // Test with zRotationLimits (radians)
  const r1 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylRotRad',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zRotationLimits: { min: -Math.PI / 4, max: Math.PI / 2 },
  })
  console.log('[03] zRotationLimits (radians):', r1.result, 'maxLevel:', r1.maxLevel)

  // Test with degree expressions
  const r2 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylRotDeg',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zRotationLimits: { min: '-90deg', max: '120deg' },
  })
  console.log('[03] zRotationLimits (degrees):', r2.result, 'maxLevel:', r2.maxLevel)

  // Retrieve both to verify storage
  const g1 = await api.v1.assembly.getCylindrical({ id: asmId, name: 'CylRotRad' })
  const g2 = await api.v1.assembly.getCylindrical({ id: asmId, name: 'CylRotDeg' })
  console.log('[03] rad limits stored:', JSON.stringify(g1.result?.zRotationLimits))
  console.log('[03] deg limits stored:', JSON.stringify(g2.result?.zRotationLimits))
  filewrite({ radLimits: g1.result, degLimits: g2.result }, 'rotation-limits-get')

  // Test partial zRotationLimits (min only) — expect error based on revolute behavior
  const r3 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylRotPartial',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zRotationLimits: { min: '-45deg' },
  })
  console.log('[03] partial zRotationLimits (min only):', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[03] partial messages:', JSON.stringify(r3.messages))

  // Test both limits together
  const r4 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylBothLimits',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zOffsetLimits: { min: -15, max: 25 },
    zRotationLimits: { min: '-60deg', max: '60deg' },
  })
  console.log('[03] both limits:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages }, 'both-limits-response')

  const g4 = await api.v1.assembly.getCylindrical({ id: asmId, name: 'CylBothLimits' })
  console.log('[03] both limits get:', JSON.stringify(g4.result?.zOffsetLimits), JSON.stringify(g4.result?.zRotationLimits))
  filewrite(g4.result, 'both-limits-get')

  await snapshot('rotation-limits')

  return { asmId }
}
