export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'ParDefaults' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 100, width: 80, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Ref1', origin: [50, 40, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Mover' })).result
  await api.v1.part.box({ id: tpl2, name: 'Block', length: 30, width: 30, height: 20 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Ref2', origin: [15, 15, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'BaseInst' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'MoverInst' })).result

  // Create with NO optional params — only required ones
  await api.v1.assembly.parallel({
    id: asmId,
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })

  // Get the constraint — default name is "Parallel"
  const g = await api.v1.assembly.getParallel({ id: asmId, name: 'Parallel' })
  console.log('[15] default name:', g.result.name)
  console.log('[15] default mate1.flip:', g.result.mate1.flip, 'mate1.reorient:', g.result.mate1.reorient)
  console.log('[15] default mate2.flip:', g.result.mate2.flip, 'mate2.reorient:', g.result.mate2.reorient)
  console.log('[15] default xOff:', JSON.stringify(g.result.xOffsetLimits))
  console.log('[15] default yOff:', JSON.stringify(g.result.yOffsetLimits))
  console.log('[15] default zOff:', JSON.stringify(g.result.zOffsetLimits))
  console.log('[15] default zRot:', JSON.stringify(g.result.zRotationLimits))
  filewrite(g.result, 'defaults')

  return {}
}
