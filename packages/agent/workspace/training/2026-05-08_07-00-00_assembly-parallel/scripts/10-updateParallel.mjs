export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 80, width: 60, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Block',
    transformation: [[40, 30, 25], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Create with no limits
  const parId = (await api.v1.assembly.parallel({
    id: asmId, name: 'UpdTest',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })).result
  console.log('[10] parallel created:', parId)

  const cogBefore = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[10] COG before update:', JSON.stringify(cogBefore?.cog))

  // Update 1: add xOffsetLimits that clamp
  const u1 = await api.v1.assembly.updateParallel({
    id: parId,
    xOffsetLimits: { min: 10, max: 20 },
  })
  console.log('[10] update xLimits:', u1.result, 'maxLevel:', u1.maxLevel)

  const cogAfterX = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[10] COG after xLimits:', JSON.stringify(cogAfterX?.cog))

  // Update 2: rename
  const u2 = await api.v1.assembly.updateParallel({ id: parId, name: 'Renamed' })
  console.log('[10] update rename:', u2.result, 'maxLevel:', u2.maxLevel)

  // Verify rename via getParallel
  const gOld = await api.v1.assembly.getParallel({ id: asmId, name: 'UpdTest' })
  const gNew = await api.v1.assembly.getParallel({ id: asmId, name: 'Renamed' })
  console.log('[10] old name:', gOld.result, 'new name id:', gNew.result?.id)

  // Update 3: add zOffsetLimits
  const u3 = await api.v1.assembly.updateParallel({
    id: parId,
    zOffsetLimits: { min: 10, max: 15 },
  })
  console.log('[10] update zLimits:', u3.result, 'maxLevel:', u3.maxLevel)

  const cogAfterZ = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[10] COG after zLimits:', JSON.stringify(cogAfterZ?.cog))

  // Update 4: remove xOffsetLimits — does position stay at clamped value or reset?
  const u4 = await api.v1.assembly.updateParallel({
    id: parId,
    xOffsetLimits: { min: null, max: null },
  })
  console.log('[10] remove xLimits:', u4.result, 'maxLevel:', u4.maxLevel)

  const cogAfterRemove = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[10] COG after remove xLimits:', JSON.stringify(cogAfterRemove?.cog))

  // Error: assembly ID instead of constraint ID
  const e1 = await api.v1.assembly.updateParallel({ id: asmId, name: 'ShouldFail' })
  console.log('[10] asm ID error:', e1.result, 'maxLevel:', e1.maxLevel)
  if (e1.messages?.length) console.log('[10] msg:', e1.messages[0]?.message, 'code:', e1.messages[0]?.code)

  filewrite({
    cogBefore: cogBefore?.cog,
    cogAfterXLimits: cogAfterX?.cog,
    cogAfterZLimits: cogAfterZ?.cog,
    cogAfterRemoveXLimits: cogAfterRemove?.cog,
  }, 'update-cog')

  return { asmId, parId }
}
