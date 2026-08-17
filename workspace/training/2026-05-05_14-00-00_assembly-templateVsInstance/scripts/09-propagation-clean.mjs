export default async function (api, { snapshot, filewrite }) {
  // Clean test: does template modification propagate to existing instances?
  // No measurements before the modification — totally clean scenario.

  const asmId = (await api.v1.assembly.create({ name: 'CleanProp' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  const boxId = (await api.v1.part.box({ id: tplId, name: 'Body', length: 60, width: 40, height: 10 })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1'
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst2',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result

  // === Modify via TEMPLATE context, change ALL dimensions (mimicking script 03) ===
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  await api.v1.part.openFeature({ id: boxId })
  await api.v1.part.updateBox({ id: boxId, length: 120, width: 80, height: 20 })
  await api.v1.part.closeFeature({ id: boxId })
  await api.v1.common.recalc({})

  // Switch back to assembly FIRST, then measure
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  await api.v1.common.recalc({})  // extra recalc at assembly level

  const mTpl = await api.v1.assembly.calculateMassProperties({ id: tplId })
  const mI1 = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  const mI2 = await api.v1.assembly.calculateMassProperties({ id: inst2 })

  console.log('[09] template vol:', mTpl.result?.volume, 'COG:', JSON.stringify(mTpl.result?.cog))
  console.log('[09] inst1 vol:', mI1.result?.volume, 'COG:', JSON.stringify(mI1.result?.cog))
  console.log('[09] inst2 vol:', mI2.result?.volume, 'COG:', JSON.stringify(mI2.result?.cog))

  // Expected:
  // Template: 120*80*20 = 192000, COG=(60,40,10)
  // If propagates: inst1 vol=192000, inst2 vol=192000
  // If NOT propagates: inst1 vol=24000 (original 60*40*10)

  filewrite({
    template: mTpl.result,
    instance1: mI1.result,
    instance2: mI2.result
  }, 'clean-propagation')

  await snapshot('clean-propagation')
  return { asmId, tplId, inst1, inst2 }
}
