// Test various value types: negative, zero, deg strings, large values, @expr binding
export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'B', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Piston' })).result
  await api.v1.part.box({ id: tplB, name: 'B', length: 20, width: 15, height: 40 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Piston',
    transformation: [[0, 0, 15], [1, 0, 0], [0, 1, 0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  const cylId = (await api.v1.assembly.cylindrical({
    id: asmId, name: 'Cyl',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })).result

  // 1. Negative Z_OFFSET
  const mp0 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[09] INITIAL COG:', mp0.cog)

  const r1 = await api.v1.assembly.update3DConstraintValue({ id: cylId, name: 'Z_OFFSET', value: -20 })
  console.log('[09] negative Z_OFFSET (-20):', r1.maxLevel, JSON.stringify(r1.messages))
  const mp1 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[09] AFTER negative Z_OFFSET COG:', mp1.cog)

  // 2. Zero value
  const r2 = await api.v1.assembly.update3DConstraintValue({ id: cylId, name: 'Z_OFFSET', value: 0 })
  console.log('[09] zero Z_OFFSET:', r2.maxLevel)
  const mp2 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[09] AFTER zero Z_OFFSET COG:', mp2.cog)

  // 3. '180deg' string for Z_ROTATION
  const r3 = await api.v1.assembly.update3DConstraintValue({ id: cylId, name: 'Z_ROTATION', value: '180deg' })
  console.log('[09] 180deg string:', r3.maxLevel)
  const mp3 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[09] AFTER 180deg COG:', mp3.cog)

  // 4. '-45deg' negative deg string
  const r4 = await api.v1.assembly.update3DConstraintValue({ id: cylId, name: 'Z_ROTATION', value: '-45deg' })
  console.log('[09] -45deg string:', r4.maxLevel, JSON.stringify(r4.messages))
  const mp4 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[09] AFTER -45deg COG:', mp4.cog)

  // 5. Large value
  const r5 = await api.v1.assembly.update3DConstraintValue({ id: cylId, name: 'Z_OFFSET', value: 1000 })
  console.log('[09] large Z_OFFSET (1000):', r5.maxLevel)
  const mp5 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[09] AFTER large Z_OFFSET COG:', mp5.cog)

  // 6. Multiple updates on SAME constraint via array (different names)
  await api.v1.assembly.update3DConstraintValue({ id: cylId, name: 'Z_OFFSET', value: 0 })
  await api.v1.assembly.update3DConstraintValue({ id: cylId, name: 'Z_ROTATION', value: 0 })

  const r6 = await api.v1.assembly.update3DConstraintValue([
    { id: cylId, name: 'Z_OFFSET', value: 50 },
    { id: cylId, name: 'Z_ROTATION', value: '90deg' },
  ])
  console.log('[09] same-constraint array:', r6.maxLevel, JSON.stringify(r6.messages))
  const mp6 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[09] AFTER same-constraint array COG:', mp6.cog)

  // 7. Expression binding attempt
  // First create an expression in the template context
  await api.v1.assembly.setCurrentProduct({ id: tplB })
  await api.v1.part.expression({ id: tplB, name: 'DISP', value: 25 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const r7 = await api.v1.assembly.update3DConstraintValue({ id: cylId, name: 'Z_OFFSET', value: '@expr.DISP' })
  console.log('[09] @expr binding:', r7.maxLevel, JSON.stringify(r7.messages))
  const mp7 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[09] AFTER @expr COG:', mp7.cog)

  filewrite({
    initial: mp0.cog,
    negOffset: mp1.cog,
    zeroOffset: mp2.cog,
    deg180: mp3.cog,
    negDeg: mp4.cog,
    largeOffset: mp5.cog,
    sameConstraintArray: mp6.cog,
    exprBinding: mp7.cog,
  }, 'results')

  return { cylId }
}
