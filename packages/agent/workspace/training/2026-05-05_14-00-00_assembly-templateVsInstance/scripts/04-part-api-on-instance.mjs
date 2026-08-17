export default async function (api, { snapshot, filewrite }) {
  // Test: can part.* APIs be called on an instance ID?
  const asmId = (await api.v1.assembly.create({ name: 'PartOnInst' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  const boxId = (await api.v1.part.box({ id: tplId, name: 'Body', length: 60, width: 40, height: 10 })).result
  const wcsId = (await api.v1.part.workCSys({
    id: tplId, name: 'MateCSys',
    origin: [30, 20, 10], xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const instId = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1'
  })).result

  console.log('[04] tplId:', tplId, 'instId:', instId, 'boxId:', boxId)

  // Try calling part.* APIs on the INSTANCE ID
  // 1. part.getFeature on instance ID
  const featOnInst = await api.v1.part.getFeature({ id: instId, name: 'Body' })
  console.log('[04] getFeature(instId, Body) maxLevel:', featOnInst.maxLevel, 'result:', featOnInst.result)

  // 2. Try to add geometry to the instance
  const addBox = await api.v1.part.box({ id: instId, name: 'Extra', length: 20, width: 20, height: 20 })
  console.log('[04] part.box(instId) maxLevel:', addBox.maxLevel, 'result:', addBox.result)
  if (addBox.messages?.length) console.log('[04] messages:', JSON.stringify(addBox.messages))

  // 3. setCurrentProduct to instance ID
  const setCPInst = await api.v1.assembly.setCurrentProduct({ id: instId })
  console.log('[04] setCurrentProduct(instId) maxLevel:', setCPInst.maxLevel, 'result:', setCPInst.result)

  // 4. Try getWorkGeometry on instance
  const gwg = await api.v1.part.getWorkGeometry({ id: instId, name: 'MateCSys' })
  console.log('[04] getWorkGeometry(instId, MateCSys) maxLevel:', gwg.maxLevel, 'result:', gwg.result)

  // 5. Try getExpression on instance (template has none, but see what error looks like)
  const expr = await api.v1.part.getExpression({ id: instId, name: 'length' })
  console.log('[04] getExpression(instId) maxLevel:', expr.maxLevel, 'result:', expr.result)

  filewrite({
    getFeatureOnInst: { maxLevel: featOnInst.maxLevel, result: featOnInst.result, messages: featOnInst.messages },
    boxOnInst: { maxLevel: addBox.maxLevel, result: addBox.result, messages: addBox.messages },
    setCurrentProductInst: { maxLevel: setCPInst.maxLevel, result: setCPInst.result },
    getWorkGeoOnInst: { maxLevel: gwg.maxLevel, result: gwg.result, messages: gwg.messages },
    getExprOnInst: { maxLevel: expr.maxLevel, result: expr.result, messages: expr.messages }
  }, 'part-api-on-instance')

  return { asmId, tplId, instId }
}
