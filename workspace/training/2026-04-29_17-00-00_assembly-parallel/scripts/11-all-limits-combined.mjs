export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'ParAll' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 120, width: 80, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Ref1', origin: [60, 40, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Mover' })).result
  await api.v1.part.box({ id: tpl2, name: 'Block', length: 40, width: 25, height: 30 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Ref2', origin: [20, 12.5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'BaseInst' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'MoverInst' })).result

  // All limits at once
  const r = await api.v1.assembly.parallel({
    id: asmId,
    name: 'FullLimits',
    mate1: { path: [inst1], csys: wcs1, flip: 'Z' },
    mate2: { path: [inst2], csys: wcs2, flip: 'Z', reorient: '90' },
    xOffsetLimits: { min: -30, max: 30 },
    yOffsetLimits: { min: -20, max: 20 },
    zOffsetLimits: { min: 0, max: 50 },
    zRotationLimits: { min: '0deg', max: '180deg' },
  })

  console.log('[11] all limits result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'all-limits-response')

  // Round-trip verify
  const g = await api.v1.assembly.getParallel({ id: asmId, name: 'FullLimits' })
  console.log('[11] verified all fields present:', Object.keys(g.result).join(', '))
  console.log('[11] xOff:', JSON.stringify(g.result.xOffsetLimits))
  console.log('[11] yOff:', JSON.stringify(g.result.yOffsetLimits))
  console.log('[11] zOff:', JSON.stringify(g.result.zOffsetLimits))
  console.log('[11] zRot:', JSON.stringify(g.result.zRotationLimits))
  filewrite(g.result, 'all-limits-verified')

  await snapshot('all-limits')
  return { constraintId: r.result }
}
