export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 100, width: 80, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Slider' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Slider' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Create planar with all params
  const planarId = (await api.v1.assembly.planar({
    id: asmId,
    name: 'FullTest',
    mate1: { path: [inst1], csys: wcsA, flip: 'Z', reorient: '0' },
    mate2: { path: [inst2], csys: wcsB, flip: '-Z', reorient: '180' },
    zOffset: 25,
    xOffsetLimits: { min: 10, max: 60 },
    yOffsetLimits: { min: 5, max: 40 },
    zRotationLimits: { min: '-45deg', max: '90deg' },
  })).result

  // Full getPlanar query
  const getR = await api.v1.assembly.getPlanar({ id: asmId, name: 'FullTest' })
  console.log('[08] getPlanar full result:', JSON.stringify(getR.result, null, 2))
  console.log('[08] maxLevel:', getR.maxLevel)

  // Test non-existent name
  const getR2 = await api.v1.assembly.getPlanar({ id: asmId, name: 'NonExistent' })
  console.log('[08] getPlanar non-existent result:', getR2.result, 'maxLevel:', getR2.maxLevel)

  // Test getPlanar returns radians for zRotationLimits
  console.log('[08] zRotationLimits min:', getR.result.zRotationLimits?.min, 'max:', getR.result.zRotationLimits?.max)
  console.log('[08] expected min≈-0.7854 (-45deg), max≈1.5708 (90deg)')

  filewrite({
    fullResult: getR.result,
    nonExistentResult: getR2.result,
    nonExistentMaxLevel: getR2.maxLevel,
  }, 'getPlanar-full')

  return { planarId }
}
