export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'CylErrAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 50, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Axis1', origin: [40, 25, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'BaseInst' })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO1', mate1: { path: [inst1], csys: wcs1 } })

  // Error: same instance in both mates
  const r1 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylSelf',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst1], csys: wcs1 },
  })
  console.log('[06] same instance:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[06] same instance msg:', r1.messages?.[0]?.message)
  console.log('[06] same instance code:', r1.messages?.[0]?.code)

  // Error: missing mate2
  const r2 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylNoMate2',
    mate1: { path: [inst1], csys: wcs1 },
  })
  console.log('[06] no mate2:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[06] no mate2 msg:', r2.messages?.[0]?.message)

  // Error: missing mate1
  const r3 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylNoMate1',
    mate2: { path: [inst1], csys: wcs1 },
  })
  console.log('[06] no mate1:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[06] no mate1 msg:', r3.messages?.[0]?.message)

  // Error: missing id
  const r4 = await api.v1.assembly.cylindrical({
    name: 'CylNoId',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst1], csys: wcs1 },
  })
  console.log('[06] no id:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[06] no id msg:', r4.messages?.[0]?.message)

  // Error: template ID in path (instead of instance ID)
  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Extra' })).result
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Axis2', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const r5 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylTplPath',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [tpl2], csys: wcs2 },
  })
  console.log('[06] template in path:', r5.result, 'maxLevel:', r5.maxLevel)
  console.log('[06] template msg:', r5.messages?.[0]?.message)
  console.log('[06] template code:', r5.messages?.[0]?.code)

  filewrite({
    sameInstance: { result: r1.result, maxLevel: r1.maxLevel, msg: r1.messages },
    noMate2: { result: r2.result, maxLevel: r2.maxLevel, msg: r2.messages },
    noMate1: { result: r3.result, maxLevel: r3.maxLevel, msg: r3.messages },
    noId: { result: r4.result, maxLevel: r4.maxLevel, msg: r4.messages },
    templateInPath: { result: r5.result, maxLevel: r5.maxLevel, msg: r5.messages },
  }, 'error-cases')

  return { asmId }
}
