export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 100, width: 80, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Slider' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 60, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Slider' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Create planar with NO rotation limits
  const planarId = (await api.v1.assembly.planar({
    id: asmId,
    name: 'TestPlanar',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 12,
  })).result

  await snapshot('no-rotation-limits')

  // Update: add rotation limits locking at 45deg
  const r1 = await api.v1.assembly.updatePlanar({ id: planarId, zRotationLimits: { min: '45deg', max: '45deg' } })
  console.log('[04] lock rotation at 45deg result:', r1.result, 'maxLevel:', r1.maxLevel)

  await snapshot('locked-45deg')

  // Update: change to range [-90deg, 90deg]
  const r2 = await api.v1.assembly.updatePlanar({ id: planarId, zRotationLimits: { min: '-90deg', max: '90deg' } })
  console.log('[04] rotation range [-90,90]deg result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Verify via getPlanar that limits were stored
  const getR = await api.v1.assembly.getPlanar({ id: asmId, name: 'TestPlanar' })
  console.log('[04] getPlanar zRotationLimits:', JSON.stringify(getR.result.zRotationLimits))

  // Remove rotation limits
  const r3 = await api.v1.assembly.updatePlanar({ id: planarId, zRotationLimits: { min: null, max: null } })
  console.log('[04] remove rotation limits result:', r3.result, 'maxLevel:', r3.maxLevel)

  const getR2 = await api.v1.assembly.getPlanar({ id: asmId, name: 'TestPlanar' })
  console.log('[04] getPlanar after remove zRotationLimits:', JSON.stringify(getR2.result.zRotationLimits))

  await snapshot('after-remove')

  filewrite({
    lock45: r1.result,
    range90: r2.result,
    limitsAfterRange: getR.result.zRotationLimits,
    removeResult: r3.result,
    limitsAfterRemove: getR2.result.zRotationLimits,
  }, 'zRotationLimits-update')

  return { planarId }
}
