export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'BatchUpdateAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'A' })).result
  await api.v1.part.box({ id: tpl1, length: 60, width: 40, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'W', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'B' })).result
  await api.v1.part.box({ id: tpl2, length: 30, width: 30, height: 30 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'W', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'C' })).result
  await api.v1.part.box({ id: tpl3, length: 20, width: 20, height: 50 })
  const wcs3 = (await api.v1.part.workCSys({
    id: tpl3, name: 'W', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'I2' })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl3, ownerId: asmId, name: 'I3' })).result

  // Create two revolute constraints
  const c1 = (await api.v1.assembly.revolute({
    id: asmId, name: 'Rev1',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result

  const c2 = (await api.v1.assembly.revolute({
    id: asmId, name: 'Rev2',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst3], csys: wcs3 },
  })).result
  console.log('[07] created c1:', c1, 'c2:', c2)

  // Batch update both
  const r = await api.v1.assembly.updateRevolute([
    { id: c1, name: 'BatchRenamed1', zOffset: 5 },
    { id: c2, name: 'BatchRenamed2', zRotationLimits: { min: '-60deg', max: '60deg' } },
  ])
  console.log('[07] batch result:', JSON.stringify(r.result), 'maxLevel:', r.maxLevel)

  // Verify both updates applied
  const after1 = (await api.v1.assembly.getRevolute({ id: asmId, name: 'BatchRenamed1' })).result
  const after2 = (await api.v1.assembly.getRevolute({ id: asmId, name: 'BatchRenamed2' })).result

  console.log('[07] c1 name:', after1?.name, 'zOffset:', after1?.zOffset)
  console.log('[07] c2 name:', after2?.name, 'limits:', JSON.stringify(after2?.zRotationLimits))

  filewrite({ batchResult: r.result, after1, after2 }, 'batch-update-result')

  return { c1, c2 }
}
