export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'FO_Offsets' })).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 30, width: 20, height: 15 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'NoOffset' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'XOffset' })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'YOffset' })).result
  const inst4 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'ZOffset' })).result
  const inst5 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'AllOffset' })).result

  const r1 = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_none', mate1: { path: [inst1], csys: wcs },
  })
  const r2 = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_x', mate1: { path: [inst2], csys: wcs }, xOffset: 50,
  })
  const r3 = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_y', mate1: { path: [inst3], csys: wcs }, yOffset: 50,
  })
  const r4 = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_z', mate1: { path: [inst4], csys: wcs }, zOffset: 50,
  })
  const r5 = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_all', mate1: { path: [inst5], csys: wcs }, xOffset: 30, yOffset: 40, zOffset: 20,
  })

  console.log('[02] no offset:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[02] xOffset=50:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[02] yOffset=50:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[02] zOffset=50:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[02] all offsets:', r5.result, 'maxLevel:', r5.maxLevel)

  filewrite({
    noOffset: { id: r1.result, maxLevel: r1.maxLevel },
    xOffset: { id: r2.result, maxLevel: r2.maxLevel },
    yOffset: { id: r3.result, maxLevel: r3.maxLevel },
    zOffset: { id: r4.result, maxLevel: r4.maxLevel },
    allOffset: { id: r5.result, maxLevel: r5.maxLevel },
  }, 'offset-results')

  await snapshot('offsets')

  return { asmId }
}
