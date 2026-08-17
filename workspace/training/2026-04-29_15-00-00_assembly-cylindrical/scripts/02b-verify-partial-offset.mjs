export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'VerifyPartialAsm' })).result

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

  // Partial zOffsetLimits: min only
  const r1 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'MinOnly',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zOffsetLimits: { min: -10 },
  })
  console.log('[02b] min-only offset:', r1.result, 'maxLevel:', r1.maxLevel)
  const g1 = await api.v1.assembly.getCylindrical({ id: asmId, name: 'MinOnly' })
  console.log('[02b] min-only get:', JSON.stringify(g1.result?.zOffsetLimits))

  // Partial zOffsetLimits: max only
  const r2 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'MaxOnly',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zOffsetLimits: { max: 30 },
  })
  console.log('[02b] max-only offset:', r2.result, 'maxLevel:', r2.maxLevel)
  const g2 = await api.v1.assembly.getCylindrical({ id: asmId, name: 'MaxOnly' })
  console.log('[02b] max-only get:', JSON.stringify(g2.result?.zOffsetLimits))

  // Empty object
  const r3 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'EmptyLimits',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zOffsetLimits: {},
  })
  console.log('[02b] empty offset limits:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[02b] empty msg:', r3.messages?.[0]?.message)

  filewrite({
    minOnly: g1.result?.zOffsetLimits,
    maxOnly: g2.result?.zOffsetLimits,
    emptyResult: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'partial-offset-verify')

  return { asmId }
}
