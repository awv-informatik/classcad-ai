export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'RevOffsetTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 50, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS', origin: [40, 25, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'Arm', length: 15, width: 50, height: 60 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS', origin: [0, 25, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BaseInst',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'ArmInst',
  })).result

  // Revolute with no offset
  const c1 = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'NoOffset',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zOffset: 0,
  })).result
  console.log('[03] no offset constraint:', c1)
  await snapshot('no-offset')

  // Check getRevolute to see zOffset value
  const g1 = await api.v1.assembly.getRevolute({ id: asmId, name: 'NoOffset' })
  filewrite(g1.result, 'no-offset-data')

  // Now delete and create with positive offset
  await api.v1.assembly.deleteConstraint({ id: c1 })

  const c2 = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'PosOffset',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zOffset: 30,
  })).result
  console.log('[03] positive offset constraint:', c2)
  await snapshot('pos-offset')

  const g2 = await api.v1.assembly.getRevolute({ id: asmId, name: 'PosOffset' })
  filewrite(g2.result, 'pos-offset-data')

  // Delete and try negative offset
  await api.v1.assembly.deleteConstraint({ id: c2 })

  const c3 = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'NegOffset',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zOffset: -20,
  })).result
  console.log('[03] negative offset constraint:', c3)
  await snapshot('neg-offset')

  const g3 = await api.v1.assembly.getRevolute({ id: asmId, name: 'NegOffset' })
  filewrite(g3.result, 'neg-offset-data')

  return { asmId }
}
