export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'CylGetAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 50, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Axis1', origin: [40, 25, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Rod' })).result
  await api.v1.part.box({ id: tpl2, name: 'Rod', length: 10, width: 10, height: 60 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Axis2', origin: [5, 5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'BaseInst' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'RodInst' })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO1', mate1: { path: [inst1], csys: wcs1 } })

  // Create with all params to test retrieval
  const cId = (await api.v1.assembly.cylindrical({
    id: asmId, name: 'GetTest',
    mate1: { path: [inst1], csys: wcs1, flip: 'Y', reorient: '90' },
    mate2: { path: [inst2], csys: wcs2, flip: '-Z', reorient: '270' },
    zOffsetLimits: { min: -15, max: 25 },
    zRotationLimits: { min: '-45deg', max: '135deg' },
  })).result
  console.log('[10] created:', cId)

  // Get and verify all fields
  const g = (await api.v1.assembly.getCylindrical({ id: asmId, name: 'GetTest' })).result
  console.log('[10] get result:', JSON.stringify(g, null, 2))
  filewrite(g, 'get-full')

  // Check field types
  console.log('[10] id type:', typeof g.id)
  console.log('[10] name type:', typeof g.name)
  console.log('[10] mate1.flip type:', typeof g.mate1.flip)
  console.log('[10] mate1.reorient type:', typeof g.mate1.reorient)
  console.log('[10] zOffsetLimits.min type:', typeof g.zOffsetLimits.min)
  console.log('[10] zRotationLimits.min type:', typeof g.zRotationLimits.min)
  console.log('[10] zRotationLimits.min value:', g.zRotationLimits.min, '(expected ~-0.785)')

  // Nonexistent name
  const g2 = await api.v1.assembly.getCylindrical({ id: asmId, name: 'NonExistent' })
  console.log('[10] nonexistent:', g2.result, 'maxLevel:', g2.maxLevel)
  console.log('[10] nonexistent msg:', g2.messages?.[0]?.message)

  // Wrong ID type — constraint ID
  const g3 = await api.v1.assembly.getCylindrical({ id: cId, name: 'GetTest' })
  console.log('[10] constraint ID:', g3.result, 'maxLevel:', g3.maxLevel)
  console.log('[10] constraint msg:', g3.messages?.[0]?.message)

  // Wrong ID type — part template
  const g4 = await api.v1.assembly.getCylindrical({ id: tpl1, name: 'GetTest' })
  console.log('[10] tpl ID:', g4.result, 'maxLevel:', g4.maxLevel)
  console.log('[10] tpl msg:', g4.messages?.[0]?.message)

  // Wrong ID type — part instance
  const g5 = await api.v1.assembly.getCylindrical({ id: inst1, name: 'GetTest' })
  console.log('[10] inst ID:', g5.result, 'maxLevel:', g5.maxLevel)
  console.log('[10] inst msg:', g5.messages?.[0]?.message)

  // Missing name
  const g6 = await api.v1.assembly.getCylindrical({ id: asmId })
  console.log('[10] no name:', g6.result, 'maxLevel:', g6.maxLevel)
  console.log('[10] no name msg:', g6.messages?.[0]?.message)

  // Batch get
  const gb = await api.v1.assembly.getCylindrical([
    { id: asmId, name: 'GetTest' },
    { id: asmId, name: 'NonExistent' },
  ])
  console.log('[10] batch get result type:', Array.isArray(gb.result) ? 'array' : typeof gb.result)
  console.log('[10] batch [0] id:', gb.result?.[0]?.id)
  console.log('[10] batch [1]:', gb.result?.[1])
  console.log('[10] batch maxLevel:', gb.maxLevel)

  filewrite({
    full: g,
    nonexistent: { result: g2.result, maxLevel: g2.maxLevel, messages: g2.messages },
    constraintId: { result: g3.result, maxLevel: g3.maxLevel, messages: g3.messages },
    tplId: { result: g4.result, maxLevel: g4.maxLevel, messages: g4.messages },
    instId: { result: g5.result, maxLevel: g5.maxLevel, messages: g5.messages },
    noName: { result: g6.result, maxLevel: g6.maxLevel, messages: g6.messages },
    batch: { result: gb.result, maxLevel: gb.maxLevel },
  }, 'get-variations')

  return { asmId }
}
