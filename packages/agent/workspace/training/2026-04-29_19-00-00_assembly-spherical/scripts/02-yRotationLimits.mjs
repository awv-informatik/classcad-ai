export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'SphericalLimits' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 60, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Socket', origin: [40, 30, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'Rod', length: 10, width: 10, height: 60 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Joint', origin: [5, 5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })

  // Test with yRotationLimits using degree expression
  const r1 = await api.v1.assembly.spherical({
    id: asmId,
    name: 'LimitedBall',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    yRotationLimits: { max: '45deg' },
  })
  console.log('[02] with yRotationLimits deg:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'limits-deg-response')

  // Delete and try with radians
  await api.v1.assembly.deleteConstraint({ ids: [r1.result] })

  const r2 = await api.v1.assembly.spherical({
    id: asmId,
    name: 'RadianBall',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    yRotationLimits: { max: Math.PI / 4 },
  })
  console.log('[02] with yRotationLimits radians:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'limits-rad-response')

  // Try without any limits (baseline)
  await api.v1.assembly.deleteConstraint({ ids: [r2.result] })
  const r3 = await api.v1.assembly.spherical({
    id: asmId,
    name: 'UnlimitedBall',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })
  console.log('[02] no limits:', r3.result, 'maxLevel:', r3.maxLevel)

  await snapshot('limits-test')
  return { asmId }
}
