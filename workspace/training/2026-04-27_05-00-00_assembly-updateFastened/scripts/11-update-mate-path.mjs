export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 60, width: 40, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS1', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl2, name: 'Box2', length: 20, width: 20, height: 30 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS2', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'Tall' })).result
  await api.v1.part.box({ id: tpl3, name: 'Box3', length: 15, width: 15, height: 60 })
  const wcs3 = (await api.v1.part.workCSys({
    id: tpl3, name: 'WCS3', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'Block' })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl3, ownerId: asmId, name: 'Tall' })).result

  // Constrain inst2 to inst1
  const cId = (await api.v1.assembly.fastened({
    id: asmId, name: 'F1',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    xOffset: 30,
  })).result

  const g0 = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[11] initial mate2 path:', JSON.stringify(g0.mate2.path))
  await snapshot('before-path-change')

  // Update mate2 to point to inst3 instead of inst2
  const r = await api.v1.assembly.updateFastened({
    id: cId,
    mate2: { path: [inst3], csys: wcs3 },
  })
  console.log('[11] update mate2 path result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'path-change-response')

  const g1 = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[11] after mate2 path:', JSON.stringify(g1.mate2.path))
  filewrite(g1, 'after-path-change')
  await snapshot('after-path-change')

  return { cId }
}
