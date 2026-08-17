export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'FO_Deg' })).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Arrow' })).result
  await api.v1.part.box({ id: tpl, name: 'Shaft', length: 50, width: 10, height: 10 })
  await api.v1.part.cone({ id: tpl, name: 'Head', height: 15, bDiameter: 20, tDiameter: 0, translation: [50, 5, 5], rotation: [0, Math.PI / 2, 0] })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Deg0' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Deg45' })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Deg90' })).result
  const inst4 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Deg180' })).result

  const r1 = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_0', mate1: { path: [inst1], csys: wcs },
  })
  const r2 = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_45', mate1: { path: [inst2], csys: wcs },
    zRotation: '45deg', zOffset: 20,
  })
  const r3 = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_90', mate1: { path: [inst3], csys: wcs },
    zRotation: '90deg', zOffset: 40,
  })
  const r4 = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_180', mate1: { path: [inst4], csys: wcs },
    zRotation: '180deg', zOffset: 60,
  })

  console.log('[04] 0deg:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[04] 45deg:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[04] 90deg:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[04] 180deg:', r4.result, 'maxLevel:', r4.maxLevel)

  filewrite({
    deg0: { id: r1.result, maxLevel: r1.maxLevel },
    deg45: { id: r2.result, maxLevel: r2.maxLevel },
    deg90: { id: r3.result, maxLevel: r3.maxLevel },
    deg180: { id: r4.result, maxLevel: r4.maxLevel },
  }, 'degree-results')

  await snapshot('degree-rotations')

  return { asmId }
}
