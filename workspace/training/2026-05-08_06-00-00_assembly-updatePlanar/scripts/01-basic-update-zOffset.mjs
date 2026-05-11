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
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Slider', transformation: [[50, 30, 0], [1, 0, 0], [0, 1, 0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Create planar with zOffset=10
  const planarId = (await api.v1.assembly.planar({
    id: asmId,
    name: 'TestPlanar',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 10,
  })).result
  console.log('[01] planarId:', planarId)

  const cogBefore = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[01] COG before update:', JSON.stringify(cogBefore.cog))

  await snapshot('before-update')

  // Update zOffset from 10 to 40
  const updateR = await api.v1.assembly.updatePlanar({ id: planarId, zOffset: 40 })
  console.log('[01] updatePlanar result:', updateR.result, 'maxLevel:', updateR.maxLevel)

  const cogAfter = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[01] COG after update:', JSON.stringify(cogAfter.cog))

  await snapshot('after-update')

  filewrite({
    planarId,
    updateResult: updateR.result,
    updateMaxLevel: updateR.maxLevel,
    cogBefore: cogBefore.cog,
    cogAfter: cogAfter.cog,
    zDelta: cogAfter.cog[2] - cogBefore.cog[2],
  }, 'zOffset-update')

  return { planarId }
}
