export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'BoxPart' })).result
  const boxFeat = (await api.v1.part.box({ id: tpl1, name: 'Box1', length: 40, width: 30, height: 20 })).result
  const wcsId = (await api.v1.part.workCSys({
    id: tpl1, name: 'Origin', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BoxInst1',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result

  const inst2 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BoxInst2',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result

  // Test: setCurrentProduct with an instance ID
  const rSCP = await api.v1.assembly.setCurrentProduct({ id: inst1 })
  console.log('[08] setCurrentProduct(inst1) result:', rSCP.result, 'maxLevel:', rSCP.maxLevel)
  filewrite({ result: rSCP.result, messages: rSCP.messages, maxLevel: rSCP.maxLevel }, 'scp-inst1')

  // Reset
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Test: setCurrentInstance with an instance ID
  const rSCI = await api.v1.assembly.setCurrentInstance({ id: inst1 })
  console.log('[08] setCurrentInstance(inst1) result:', rSCI.result, 'maxLevel:', rSCI.maxLevel)
  filewrite({ result: rSCI.result, messages: rSCI.messages, maxLevel: rSCI.maxLevel }, 'sci-inst1')

  // Reset
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Test: setCurrentProduct with template ID
  const rSCPtpl = await api.v1.assembly.setCurrentProduct({ id: tpl1 })
  console.log('[08] setCurrentProduct(tpl1) result:', rSCPtpl.result, 'maxLevel:', rSCPtpl.maxLevel)

  // Can we call assembly.getInstance from this context?
  const instsFromProduct = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[08] getInstance(asmId) after setCurrentProduct(tpl1):', JSON.stringify(instsFromProduct.result))

  // Reset and test with setCurrentInstance(tpl1)
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  await api.v1.assembly.setCurrentInstance({ id: tpl1 })

  const instsFromInstance = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[08] getInstance(asmId) after setCurrentInstance(tpl1):', JSON.stringify(instsFromInstance.result))

  // Test: can we add a constraint after setCurrentInstance?
  // This tests whether setCurrentInstance makes the solver context aware of instance positions
  await api.v1.assembly.setCurrentInstance({ id: asmId })

  const rFastened = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO1',
    mate1: { path: [inst1], csys: wcsId }
  })
  console.log('[08] fastenedOrigin after setCurrentInstance(asmId):', rFastened.result, 'maxLevel:', rFastened.maxLevel)

  filewrite({
    scpInst1: rSCP.result,
    sciInst1: rSCI.result,
    fastenedResult: rFastened.result,
    fastenedMaxLevel: rFastened.maxLevel
  }, 'comparison')

  await snapshot('final')
  return { asmId }
}
