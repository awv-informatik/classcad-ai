export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'ParGet' })).result

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

  await api.v1.assembly.parallel({
    id: asmId,
    name: 'MyParallel',
    mate1: { path: [inst1], csys: wcs1, flip: '-Z', reorient: '180' },
    mate2: { path: [inst2], csys: wcs2, flip: 'Y', reorient: '270' },
    xOffsetLimits: { min: -5, max: 15 },
    yOffsetLimits: { min: 0, max: 25 },
    zOffsetLimits: { min: -10, max: 10 },
    zRotationLimits: { min: 0, max: 3.14159 },
  })

  // Get by name on the assembly
  const g = await api.v1.assembly.getParallel({ id: asmId, name: 'MyParallel' })
  console.log('[07] getParallel result id:', g.result.id, 'name:', g.result.name)
  console.log('[07] mate1.flip:', g.result.mate1.flip, 'mate1.reorient:', g.result.mate1.reorient)
  console.log('[07] mate2.flip:', g.result.mate2.flip, 'mate2.reorient:', g.result.mate2.reorient)
  console.log('[07] xOffsetLimits:', JSON.stringify(g.result.xOffsetLimits))
  console.log('[07] yOffsetLimits:', JSON.stringify(g.result.yOffsetLimits))
  console.log('[07] zOffsetLimits:', JSON.stringify(g.result.zOffsetLimits))
  console.log('[07] zRotationLimits:', JSON.stringify(g.result.zRotationLimits))
  filewrite(g.result, 'get-full-result')

  // Also test getParallel by instance ID
  const g2 = await api.v1.assembly.getParallel({ id: inst1, name: 'MyParallel' })
  console.log('[07] getParallel by inst1:', g2.result ? g2.result.id : 'VOID', 'maxLevel:', g2.maxLevel)

  // Test non-existent name
  const g3 = await api.v1.assembly.getParallel({ id: asmId, name: 'NonExistent' })
  console.log('[07] getParallel non-existent:', g3.result, 'maxLevel:', g3.maxLevel)
  filewrite({ result: g3.result, messages: g3.messages, maxLevel: g3.maxLevel }, 'get-nonexistent')

  return {}
}
