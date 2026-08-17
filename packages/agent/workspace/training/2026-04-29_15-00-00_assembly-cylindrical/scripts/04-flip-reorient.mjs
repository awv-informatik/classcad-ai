export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'CylFlipAsm' })).result

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

  // Default flip (Z) — baseline
  const r1 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylFlipZ',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })
  console.log('[04] flip Z (default):', r1.result, 'maxLevel:', r1.maxLevel)
  await snapshot('flip-Z')

  // Flip -Z on mate2
  const r2 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylFlipNegZ',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2, flip: '-Z' },
  })
  console.log('[04] flip -Z:', r2.result, 'maxLevel:', r2.maxLevel)
  await snapshot('flip-negZ')

  // Flip X on mate2
  const r3 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylFlipX',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2, flip: 'X' },
  })
  console.log('[04] flip X:', r3.result, 'maxLevel:', r3.maxLevel)
  await snapshot('flip-X')

  // Reorient 90 on mate2
  const r4 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylReorient90',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2, reorient: '90' },
  })
  console.log('[04] reorient 90:', r4.result, 'maxLevel:', r4.maxLevel)
  await snapshot('reorient-90')

  // Reorient 180 on mate2
  const r5 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylReorient180',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2, reorient: '180' },
  })
  console.log('[04] reorient 180:', r5.result, 'maxLevel:', r5.maxLevel)

  // Retrieve all to verify flip/reorient stored
  const gets = []
  for (const name of ['CylFlipZ', 'CylFlipNegZ', 'CylFlipX', 'CylReorient90', 'CylReorient180']) {
    const g = await api.v1.assembly.getCylindrical({ id: asmId, name })
    gets.push({ name, mate1Flip: g.result?.mate1?.flip, mate2Flip: g.result?.mate2?.flip, mate2Reorient: g.result?.mate2?.reorient })
  }
  console.log('[04] flip/reorient summary:', JSON.stringify(gets, null, 2))
  filewrite(gets, 'flip-reorient-summary')

  // Invalid flip value
  const r6 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylInvalidFlip',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2, flip: 'INVALID' },
  })
  console.log('[04] invalid flip:', r6.result, 'maxLevel:', r6.maxLevel, 'msg:', r6.messages?.[0]?.message)

  // Invalid reorient value
  const r7 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylInvalidReorient',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2, reorient: '45' },
  })
  console.log('[04] invalid reorient:', r7.result, 'maxLevel:', r7.maxLevel, 'msg:', r7.messages?.[0]?.message)

  return { asmId }
}
