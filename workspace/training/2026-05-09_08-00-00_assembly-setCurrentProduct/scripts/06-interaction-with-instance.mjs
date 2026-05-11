export default async function (api, { snapshot, filewrite }) {
  // Clean setup: assembly first, then test interaction
  const asmId = (await api.v1.assembly.create({})).result
  console.log('[06] asmId:', asmId)
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tplId, length: 40, width: 30, height: 20 })
  console.log('[06] tplId:', tplId)

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const instId = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  console.log('[06] instId:', instId)

  // Test 1: setCurrentInstance sets product — does setCurrentProduct see it?
  await api.v1.assembly.setCurrentInstance({ id: instId })
  // currentProduct should now be tplId (via setCurrentInstance)
  const r1 = await api.v1.assembly.setCurrentProduct({ id: asmId })
  console.log('[06] after setCurrentInstance(inst), setCurrentProduct(asm) returns:', r1.result)
  console.log('[06] expected tplId:', tplId, 'match:', r1.result === tplId)
  filewrite({
    test: 'instance-sets-product',
    returnedPrevious: r1.result,
    expectedPrevious: tplId,
    match: r1.result === tplId
  }, 'test1')

  // Test 2: setCurrentProduct to instance ID — what does it set the product to?
  await api.v1.assembly.setCurrentProduct({ id: asmId }) // reset to asm
  const r2 = await api.v1.assembly.setCurrentProduct({ id: instId })
  console.log('[06] setCurrentProduct(instId) result (prev):', r2.result, 'maxLevel:', r2.maxLevel)
  // Now switch again to see what current product was set to
  const r3 = await api.v1.assembly.setCurrentProduct({ id: asmId })
  console.log('[06] switching away reveals current was:', r3.result)
  console.log('[06] was it the instance ID?', r3.result === instId)
  console.log('[06] was it the template ID?', r3.result === tplId)
  filewrite({
    test: 'instance-as-product',
    switchToInst_prev: r2.result,
    switchAway_prev: r3.result,
    isInstanceId: r3.result === instId,
    isTemplateId: r3.result === tplId
  }, 'test2')

  // Test 3: Does setCurrentProduct with instance ID also set currentInstance?
  // Switch to instance via setCurrentProduct
  await api.v1.assembly.setCurrentProduct({ id: instId })
  // Now try openFeature on the template's feature
  const boxFeat = 70 // from tplId creation
  try {
    // This tests if we're in the right product context
    await api.v1.part.openFeature({ id: boxFeat })
    console.log('[06] openFeature after setCurrentProduct(instId): SUCCESS')
    await api.v1.part.closeFeature({ id: boxFeat })
    filewrite({ test: 'instance-enables-template-edit', result: 'success' }, 'test3')
  } catch (e) {
    console.log('[06] openFeature failed:', e.message)
    filewrite({ test: 'instance-enables-template-edit', result: 'error', error: e.message }, 'test3')
  }

  return { asmId, tplId, instId }
}
