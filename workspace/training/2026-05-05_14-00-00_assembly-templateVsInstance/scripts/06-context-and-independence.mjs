export default async function (api, { snapshot, filewrite }) {
  // Test: setCurrentProduct to instance, then try part.* APIs
  // Also test: can we modify one instance independently?
  const asmId = (await api.v1.assembly.create({ name: 'CtxTest' })).result
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

  console.log('[06] tplId:', tplId, 'inst1:', inst1, 'inst2:', inst2, 'boxId:', boxId)

  // Test setCurrentProduct to instance
  const prev = await api.v1.assembly.setCurrentProduct({ id: inst1 })
  console.log('[06] setCurrentProduct(inst1) — prev:', prev.result, 'maxLevel:', prev.maxLevel)

  // After setting to instance, test various part.* APIs
  // a) getFeature using the TEMPLATE ID (not instance)
  const feat1 = await api.v1.part.getFeature({ id: tplId, name: 'Body' })
  console.log('[06] getFeature(tplId) after context=inst1: maxLevel:', feat1.maxLevel, 'result:', feat1.result)

  // b) openFeature on the template's box ID
  const openR = await api.v1.part.openFeature({ id: boxId })
  console.log('[06] openFeature(boxId) after context=inst1: maxLevel:', openR.maxLevel)

  if (openR.maxLevel <= 31) {
    // If open succeeded, try to update — would this affect only inst1?
    const updateR = await api.v1.part.updateBox({ id: boxId, height: 30 })
    console.log('[06] updateBox height=30 maxLevel:', updateR.maxLevel)
    await api.v1.part.closeFeature({ id: boxId })
    await api.v1.common.recalc({})

    // Measure both instances to see if the change is instance-specific or template-wide
    await api.v1.assembly.setCurrentProduct({ id: asmId })
    const m1 = await api.v1.assembly.calculateMassProperties({ id: inst1 })
    const m2 = await api.v1.assembly.calculateMassProperties({ id: inst2 })
    console.log('[06] after update: inst1 volume:', m1.result?.volume, 'inst2 volume:', m2.result?.volume)
    console.log('[06] after update: inst1 COG:', JSON.stringify(m1.result?.cog))
    console.log('[06] after update: inst2 COG:', JSON.stringify(m2.result?.cog))

    filewrite({
      inst1Mass: m1.result,
      inst2Mass: m2.result
    }, 'after-context-modify')
  } else {
    console.log('[06] openFeature failed — cannot modify via instance context')
    await api.v1.assembly.setCurrentProduct({ id: asmId })
  }

  await snapshot('after-context-test')
  return { asmId, tplId, inst1, inst2 }
}
