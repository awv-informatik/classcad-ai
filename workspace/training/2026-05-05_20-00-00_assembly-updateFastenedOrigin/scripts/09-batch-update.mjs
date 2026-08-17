export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Three instances
  const instA = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'A',
  })).result
  const instB = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'B',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const instC = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'C',
    transformation: [[120, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create individual constraints
  const foA = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_A',
    mate1: { path: [instA], csys: wcs },
    xOffset: 0,
  })).result
  const foB = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_B',
    mate1: { path: [instB], csys: wcs },
    xOffset: 60,
  })).result
  const foC = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_C',
    mate1: { path: [instC], csys: wcs },
    xOffset: 120,
  })).result

  const cogBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result?.cog
  console.log('[09] COG before batch:', JSON.stringify(cogBefore))

  // Batch update — array of updates
  const batchR = await api.v1.assembly.updateFastenedOrigin([
    { id: foA, xOffset: 10, yOffset: 50 },
    { id: foB, xOffset: 70, zRotation: '45deg' },
    { id: foC, xOffset: 130, mate1: { flip: '-Z' } },
  ])
  console.log('[09] batch result:', JSON.stringify(batchR.result), 'maxLevel:', batchR.maxLevel)
  if (batchR.messages?.length) {
    for (const m of batchR.messages) console.log('[09] msg:', m.message, 'code:', m.code)
  }

  const cogAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result?.cog
  console.log('[09] COG after batch:', JSON.stringify(cogAfter))
  await snapshot('batch-update')

  // Verify each constraint state
  const stateA = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_A' })).result
  const stateB = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_B' })).result
  const stateC = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_C' })).result
  console.log('[09] A: xOffset=%d yOffset=%d', stateA?.xOffset, stateA?.yOffset)
  console.log('[09] B: xOffset=%d zRotation=%s', stateB?.xOffset, stateB?.zRotation)
  console.log('[09] C: xOffset=%d flip=%s', stateC?.xOffset, stateC?.mate1?.flip)

  filewrite({
    cogBefore, cogAfter,
    batchResult: batchR.result,
    batchMaxLevel: batchR.maxLevel,
    stateA, stateB, stateC,
  }, 'batch-results')

  return { foA, foB, foC }
}
