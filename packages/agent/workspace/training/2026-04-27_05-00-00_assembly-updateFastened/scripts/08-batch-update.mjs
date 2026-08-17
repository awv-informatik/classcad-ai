export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 60, width: 40, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS1', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl2, name: 'Box2', length: 20, width: 20, height: 20 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS2', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'Cylinder' })).result
  await api.v1.part.cylinder({ id: tpl3, name: 'Cyl', radius: 10, height: 30 })
  const wcs3 = (await api.v1.part.workCSys({
    id: tpl3, name: 'WCS3', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'Block' })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl3, ownerId: asmId, name: 'Cyl' })).result

  // Create two constraints
  const c1 = (await api.v1.assembly.fastened({
    id: asmId, name: 'C1',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    xOffset: 10,
  })).result

  const c2 = (await api.v1.assembly.fastened({
    id: asmId, name: 'C2',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst3], csys: wcs3 },
    xOffset: 20,
  })).result

  console.log('[08] created c1:', c1, 'c2:', c2)

  // Batch update
  const r = await api.v1.assembly.updateFastened([
    { id: c1, xOffset: 100, name: 'C1_updated' },
    { id: c2, xOffset: 200, zRotation: '45deg', name: 'C2_updated' },
  ])
  console.log('[08] batch result:', JSON.stringify(r.result), 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-response')

  // Verify both
  const g1 = (await api.v1.assembly.getFastened({ id: asmId, name: 'C1_updated' })).result
  const g2 = (await api.v1.assembly.getFastened({ id: asmId, name: 'C2_updated' })).result
  console.log('[08] C1_updated:', JSON.stringify({ x: g1?.xOffset, name: g1?.name }))
  console.log('[08] C2_updated:', JSON.stringify({ x: g2?.xOffset, zRot: g2?.zRotation, name: g2?.name }))
  filewrite({ c1: g1, c2: g2 }, 'batch-verify')

  return { c1, c2 }
}
