export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'BoxA', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'CsysA', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'BoxB', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'CsysB', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm',
    transformation: [[80, 0, 15], [1, 0, 0], [0, 1, 0]],
  })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Test 1: revolute with rotation limits in radians
  const r1 = await api.v1.assembly.revolute({
    id: asmId, name: 'RevLimits',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zRotationLimits: { min: -1.5708, max: 1.5708 }, // ±90°
  })
  console.log('[06] revolute result:', r1.result, 'maxLevel:', r1.maxLevel)

  const mass2 = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[06] inst2 COG with limits:', JSON.stringify(mass2?.cog))

  // Readback
  const getR1 = (await api.v1.assembly.getRevolute({ id: asmId, name: 'RevLimits' })).result
  console.log('[06] getRevolute limits:', JSON.stringify(getR1?.zRotationLimits))

  await snapshot('with-limits')

  filewrite(getR1, 'limits-radian')

  // Clean up for test 2 — delete constraint and try deg strings
  await api.v1.assembly.deleteConstraint({ id: r1.result })

  // Reset inst2 position
  await api.v1.assembly.transformInstanceTo({
    id: inst2,
    transformation: [[80, 0, 15], [1, 0, 0], [0, 1, 0]],
  })

  // Test 2: rotation limits with degree strings
  const r2 = await api.v1.assembly.revolute({
    id: asmId, name: 'RevDeg',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zRotationLimits: { min: '-45deg', max: '180deg' },
  })
  console.log('[06] revolute deg result:', r2.result, 'maxLevel:', r2.maxLevel)

  const getR2 = (await api.v1.assembly.getRevolute({ id: asmId, name: 'RevDeg' })).result
  console.log('[06] getRevolute deg limits:', JSON.stringify(getR2?.zRotationLimits))
  // Check if stored as radians or degrees
  console.log('[06] min in degrees:', (getR2?.zRotationLimits?.min * 180 / Math.PI).toFixed(2))
  console.log('[06] max in degrees:', (getR2?.zRotationLimits?.max * 180 / Math.PI).toFixed(2))

  await snapshot('deg-limits')

  filewrite(getR2, 'limits-deg')

  return { asmId }
}
