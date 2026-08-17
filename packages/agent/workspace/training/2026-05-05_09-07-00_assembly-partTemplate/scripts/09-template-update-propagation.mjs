export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'PropTest' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result

  // Build initial geometry
  const boxId = (await api.v1.part.box({ id: tplId, name: 'Body', length: 60, width: 40, height: 10 })).result
  console.log('[09] boxId:', boxId)

  // Return to assembly, create two instances at different positions
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const i1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Inst1' })).result
  const i2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst2',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Measure volumes before update
  const m1Before = (await api.v1.assembly.calculateMassProperties({ id: i1 })).result
  const m2Before = (await api.v1.assembly.calculateMassProperties({ id: i2 })).result
  console.log('[09] i1 vol before:', m1Before.volume, 'cog:', JSON.stringify(m1Before.cog))
  console.log('[09] i2 vol before:', m2Before.volume, 'cog:', JSON.stringify(m2Before.cog))

  await snapshot('before-update')

  // Update the template — change box height from 10 to 40
  await api.v1.part.openFeature({ id: boxId })
  const upR = await api.v1.part.updateBox({ id: boxId, height: 40 })
  console.log('[09] updateBox maxLevel:', upR.maxLevel)
  await api.v1.part.closeFeature({ id: boxId })
  await api.v1.common.recalc({})

  // Measure volumes after update
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const m1After = (await api.v1.assembly.calculateMassProperties({ id: i1 })).result
  const m2After = (await api.v1.assembly.calculateMassProperties({ id: i2 })).result
  console.log('[09] i1 vol after:', m1After.volume, 'cog:', JSON.stringify(m1After.cog))
  console.log('[09] i2 vol after:', m2After.volume, 'cog:', JSON.stringify(m2After.cog))

  // Expected: volume should change from 60*40*10=24000 to 60*40*40=96000
  console.log('[09] volume changed?', m1Before.volume !== m1After.volume)
  console.log('[09] both instances updated?', m1After.volume === m2After.volume)

  filewrite({
    before: { i1: m1Before, i2: m2Before },
    after: { i1: m1After, i2: m2After },
    propagated: m1Before.volume !== m1After.volume,
  }, 'propagation')

  await snapshot('after-update')

  return { asmId }
}
