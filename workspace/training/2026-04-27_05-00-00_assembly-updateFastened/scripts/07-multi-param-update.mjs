export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 60, width: 40, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS1', origin: [30, 20, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl2, name: 'Box2', length: 20, width: 15, height: 40 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS2', origin: [10, 7, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'Block' })).result

  const cId = (await api.v1.assembly.fastened({
    id: asmId, name: 'F1',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result
  await snapshot('before-multi')

  // Update multiple params at once: name + offsets + rotation + flip
  const r = await api.v1.assembly.updateFastened({
    id: cId,
    name: 'MultiUpdated',
    xOffset: 40,
    yOffset: -10,
    zOffset: 15,
    zRotation: '30deg',
    mate1: { flip: '-Z' },
  })
  console.log('[07] multi-update result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'multi-update-response')

  await snapshot('after-multi')

  const g = (await api.v1.assembly.getFastened({ id: asmId, name: 'MultiUpdated' })).result
  console.log('[07] after multi-update:', JSON.stringify({
    name: g.name, x: g.xOffset, y: g.yOffset, z: g.zOffset,
    zRot: g.zRotation, m1flip: g.mate1.flip,
  }))
  filewrite(g, 'after-multi-update')

  return { cId }
}
