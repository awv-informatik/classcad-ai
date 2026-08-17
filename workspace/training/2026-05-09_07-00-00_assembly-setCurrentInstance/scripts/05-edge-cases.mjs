export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'BoxPart' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 40, width: 30, height: 20 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BoxInst',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result

  // Test 1: Invalid ID
  const rBad = await api.v1.assembly.setCurrentInstance({ id: 99999 })
  console.log('[05] setCurrentInstance(99999) result:', rBad.result, 'maxLevel:', rBad.maxLevel)
  filewrite({ result: rBad.result, messages: rBad.messages, maxLevel: rBad.maxLevel }, 'bad-id')

  // Test 2: ID of a non-instance object (e.g., a box feature)
  // First switch to template context
  await api.v1.assembly.setCurrentInstance({ id: inst1 })
  const featureId = (await api.v1.part.getFeature({ id: tpl1, name: 'Box1' })).result
  console.log('[05] featureId (Box1):', featureId)

  // Now try setCurrentInstance with a feature ID
  await api.v1.assembly.setCurrentInstance({ id: asmId }) // reset first
  const rFeat = await api.v1.assembly.setCurrentInstance({ id: featureId })
  console.log('[05] setCurrentInstance(featureId) result:', rFeat.result, 'maxLevel:', rFeat.maxLevel)
  filewrite({ result: rFeat.result, messages: rFeat.messages, maxLevel: rFeat.maxLevel }, 'feature-id')

  // Test 3: Call setCurrentInstance twice on same instance
  await api.v1.assembly.setCurrentInstance({ id: inst1 })
  const rDouble = await api.v1.assembly.setCurrentInstance({ id: inst1 })
  console.log('[05] setCurrentInstance(inst1) twice result:', rDouble.result, 'maxLevel:', rDouble.maxLevel)

  // Test 4: setCurrentInstance with string ident
  await api.v1.assembly.setIdent({ id: inst1, ident: 'myBoxIdent' })
  const rIdent = await api.v1.assembly.setCurrentInstance({ id: 'myBoxIdent' })
  console.log('[05] setCurrentInstance("myBoxIdent") result:', rIdent.result, 'maxLevel:', rIdent.maxLevel)
  filewrite({ result: rIdent.result, messages: rIdent.messages, maxLevel: rIdent.maxLevel }, 'ident-string')

  return { asmId }
}
