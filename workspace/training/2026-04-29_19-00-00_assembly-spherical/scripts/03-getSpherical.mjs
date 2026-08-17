export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GetSphericalTest' })).result

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

  // Create with limits
  const cId = (await api.v1.assembly.spherical({
    id: asmId,
    name: 'TestBall',
    mate1: { path: [inst1], csys: wcs1, flip: 'Y', reorient: '90' },
    mate2: { path: [inst2], csys: wcs2, flip: '-Z', reorient: '180' },
    yRotationLimits: { max: '60deg' },
  })).result
  console.log('[03] created:', cId)

  // Get it back
  const g = await api.v1.assembly.getSpherical({ id: asmId, name: 'TestBall' })
  console.log('[03] getSpherical maxLevel:', g.maxLevel)
  filewrite(g.result, 'get-response')

  // Get nonexistent
  const g2 = await api.v1.assembly.getSpherical({ id: asmId, name: 'Nonexistent' })
  console.log('[03] getSpherical nonexistent:', g2.result, 'maxLevel:', g2.maxLevel)
  filewrite({ result: g2.result, messages: g2.messages, maxLevel: g2.maxLevel }, 'get-notfound')

  // Create without limits, get it
  await api.v1.assembly.deleteConstraint({ ids: [cId] })
  const cId2 = (await api.v1.assembly.spherical({
    id: asmId,
    name: 'NoLimitBall',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result
  const g3 = await api.v1.assembly.getSpherical({ id: asmId, name: 'NoLimitBall' })
  console.log('[03] getSpherical no limits maxLevel:', g3.maxLevel)
  filewrite(g3.result, 'get-nolimits')

  return { asmId }
}
