export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'FO_Rot' })).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'LShape' })).result
  await api.v1.part.box({ id: tpl, name: 'Long', length: 60, width: 20, height: 10 })
  await api.v1.part.box({ id: tpl, name: 'Short', length: 10, width: 40, height: 10 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'NoRot' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'XRot' })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'YRot' })).result
  const inst4 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'ZRot' })).result

  const halfPi = Math.PI / 2

  const r1 = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_none', mate1: { path: [inst1], csys: wcs },
  })
  const r2 = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_xrot', mate1: { path: [inst2], csys: wcs },
    xRotation: halfPi, yOffset: 80,
  })
  const r3 = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_yrot', mate1: { path: [inst3], csys: wcs },
    yRotation: halfPi, xOffset: 80,
  })
  const r4 = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_zrot', mate1: { path: [inst4], csys: wcs },
    zRotation: halfPi, xOffset: 0, yOffset: -80,
  })

  console.log('[03] no rotation:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[03] xRot π/2:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[03] yRot π/2:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[03] zRot π/2:', r4.result, 'maxLevel:', r4.maxLevel)

  filewrite({
    noRot: { id: r1.result, maxLevel: r1.maxLevel },
    xRot: { id: r2.result, maxLevel: r2.maxLevel },
    yRot: { id: r3.result, maxLevel: r3.maxLevel },
    zRot: { id: r4.result, maxLevel: r4.maxLevel },
  }, 'rotation-results')

  await snapshot('rotations')

  return { asmId }
}
