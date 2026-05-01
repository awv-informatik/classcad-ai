export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'CylOffsetAsm' })).result

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

  // Test with zOffsetLimits
  const r1 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylOffset',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zOffsetLimits: { min: -20, max: 30 },
  })
  console.log('[02] with zOffsetLimits:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'offset-limits-response')

  // Retrieve to verify limits stored
  const g1 = await api.v1.assembly.getCylindrical({ id: asmId, name: 'CylOffset' })
  console.log('[02] getCylindrical zOffsetLimits:', JSON.stringify(g1.result?.zOffsetLimits))
  console.log('[02] getCylindrical zRotationLimits:', JSON.stringify(g1.result?.zRotationLimits))
  filewrite(g1.result, 'offset-limits-get')

  // Test partial zOffsetLimits (min only)
  const r2 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylOffsetPartial',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zOffsetLimits: { min: -10 },
  })
  console.log('[02] partial zOffsetLimits (min only):', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[02] partial messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'offset-partial-response')

  await snapshot('offset-limits')

  return { asmId }
}
