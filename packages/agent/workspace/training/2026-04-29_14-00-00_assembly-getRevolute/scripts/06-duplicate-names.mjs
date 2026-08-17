export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'B1', length: 40, width: 30, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({ id: tpl1, name: 'WCS1', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'B2', length: 60, width: 20, height: 15 })
  const wcs2 = (await api.v1.part.workCSys({ id: tpl2, name: 'WCS2', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'Arm2' })).result
  await api.v1.part.box({ id: tpl3, name: 'B3', length: 30, width: 15, height: 10 })
  const wcs3 = (await api.v1.part.workCSys({ id: tpl3, name: 'WCS3', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'I2' })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl3, ownerId: asmId, name: 'I3' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO1', mate1: { path: [inst1], csys: wcs1 } })

  // Create two revolute constraints with the SAME name but different offsets
  const rev1 = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'SameName',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zOffset: 10,
  })).result
  console.log('[06] first constraint id:', rev1)

  const rev2 = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'SameName',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst3], csys: wcs3 },
    zOffset: 99,
  })).result
  console.log('[06] second constraint id:', rev2)

  const r = await api.v1.assembly.getRevolute({ id: asmId, name: 'SameName' })
  console.log('[06] getRevolute id:', r.result.id)
  console.log('[06] zOffset:', r.result.zOffset)
  console.log('[06] matches first?', r.result.id === rev1)
  console.log('[06] matches second?', r.result.id === rev2)

  filewrite({
    firstId: rev1,
    secondId: rev2,
    returnedId: r.result.id,
    returnedZOffset: r.result.zOffset,
    matchesFirst: r.result.id === rev1,
  }, 'duplicate-names')

  return { asmId }
}
