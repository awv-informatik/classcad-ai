export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'BatchTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Hub' })).result
  await api.v1.part.box({ id: tpl1, name: 'Body', length: 60, width: 60, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'J1', origin: [15, 30, 20],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const wcs1b = (await api.v1.part.workCSys({
    id: tpl1, name: 'J2', origin: [45, 30, 20],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'Rod', length: 10, width: 10, height: 50 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Joint', origin: [5, 5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })

  // Batch create 2 spherical constraints
  const r = await api.v1.assembly.spherical([
    {
      id: asmId,
      name: 'BallL',
      mate1: { path: [inst1], csys: wcs1 },
      mate2: { path: [inst2], csys: wcs2 },
    },
    {
      id: asmId,
      name: 'BallR',
      mate1: { path: [inst1], csys: wcs1b },
      mate2: { path: [inst3], csys: wcs2 },
      yRotationLimits: { max: '30deg' },
    },
  ])
  console.log('[06] batch result:', JSON.stringify(r.result), 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-response')

  await snapshot('batch-spherical')
  return { asmId }
}
