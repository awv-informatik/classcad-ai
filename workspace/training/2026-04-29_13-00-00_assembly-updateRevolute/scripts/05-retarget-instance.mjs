export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'RetargetAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, length: 80, width: 50, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'W', origin: [40, 25, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, length: 10, width: 20, height: 50 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'W', origin: [5, 10, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'Alt' })).result
  await api.v1.part.cylinder({ id: tpl3, height: 40, diameter: 20 })
  const wcs3 = (await api.v1.part.workCSys({
    id: tpl3, name: 'W', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'BaseInst' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'ArmInst' })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl3, ownerId: asmId, name: 'AltInst' })).result

  // Anchor base
  await api.v1.assembly.fastenedOrigin({ id: asmId, mate1: { path: [inst1], csys: wcs1 } })

  // Create revolute between inst1 and inst2
  const cId = (await api.v1.assembly.revolute({
    id: asmId, name: 'RetargetRev',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result
  console.log('[05] created between inst1-inst2:', cId)
  await snapshot('before-retarget')

  const before = (await api.v1.assembly.getRevolute({ id: asmId, name: 'RetargetRev' })).result
  console.log('[05] before mate2 path:', JSON.stringify(before.mate2.path), 'csys:', before.mate2.csys)

  // Retarget mate2 to inst3 (different template, different csys)
  const r = await api.v1.assembly.updateRevolute({
    id: cId,
    mate2: { path: [inst3], csys: wcs3 },
  })
  console.log('[05] retarget result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite(r.messages, 'retarget-messages')

  const after = (await api.v1.assembly.getRevolute({ id: asmId, name: 'RetargetRev' })).result
  console.log('[05] after mate2 path:', JSON.stringify(after?.mate2?.path), 'csys:', after?.mate2?.csys)
  filewrite({ before: before.mate2, after: after?.mate2 }, 'retarget-comparison')
  await snapshot('after-retarget')

  return { cId }
}
