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

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'Block',
    transformation: [[70, 15, 25], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create with offset=0 (mate at origin)
  const cId = (await api.v1.assembly.fastened({
    id: asmId, name: 'F1',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    xOffset: 10, yOffset: 5, zOffset: 3,
  })).result

  const g0 = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[06] before useCurrentTransform:', JSON.stringify({
    x: g0.xOffset, y: g0.yOffset, z: g0.zOffset,
    xR: g0.xRotation, yR: g0.yRotation, zR: g0.zRotation,
  }))
  filewrite(g0, 'before-useCurrentTransform')

  // Now update with useCurrentTransform — should recompute from current positions
  const r = await api.v1.assembly.updateFastened({ id: cId, useCurrentTransform: true })
  console.log('[06] useCurrentTransform result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'useCurrentTransform-response')

  const g1 = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[06] after useCurrentTransform:', JSON.stringify({
    x: g1.xOffset, y: g1.yOffset, z: g1.zOffset,
    xR: g1.xRotation, yR: g1.yRotation, zR: g1.zRotation,
  }))
  filewrite(g1, 'after-useCurrentTransform')

  // Also test: pass offsets WITH useCurrentTransform — does it ignore them?
  const r2 = await api.v1.assembly.updateFastened({ id: cId, useCurrentTransform: true, xOffset: 999, yOffset: 888 })
  console.log('[06] useCurrentTransform + offsets result:', r2.result, 'maxLevel:', r2.maxLevel)
  const g2 = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[06] offsets overridden?:', JSON.stringify({ x: g2.xOffset, y: g2.yOffset, z: g2.zOffset }))
  filewrite(g2, 'useCurrentTransform-with-offsets')

  return { cId }
}
