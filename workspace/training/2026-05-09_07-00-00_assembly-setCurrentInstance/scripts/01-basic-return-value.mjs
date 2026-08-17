export default async function (api, { snapshot, filewrite }) {
  // Create assembly with two part templates
  const asmId = (await api.v1.assembly.create({})).result
  console.log('[01] asmId:', asmId)

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'BoxPart' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 40, width: 30, height: 20 })

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'CylPart' })).result
  await api.v1.part.cylinder({ id: tpl2, name: 'Cyl1', height: 30, diameter: 20 })

  // Return to assembly context
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create instances
  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BoxInst',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result

  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'CylInst',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result

  console.log('[01] inst1:', inst1, 'inst2:', inst2)

  // Test 1: setCurrentInstance with an instance ID
  const r1 = await api.v1.assembly.setCurrentInstance({ id: inst1 })
  console.log('[01] setCurrentInstance(inst1) result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'sci-inst1')

  // Test 2: setCurrentInstance with root assembly ID
  const r2 = await api.v1.assembly.setCurrentInstance({ id: asmId })
  console.log('[01] setCurrentInstance(asmId) result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'sci-asmId')

  // Test 3: setCurrentInstance with second instance
  const r3 = await api.v1.assembly.setCurrentInstance({ id: inst2 })
  console.log('[01] setCurrentInstance(inst2) result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'sci-inst2')

  // Test 4: setCurrentInstance with a template ID (should this work?)
  const r4 = await api.v1.assembly.setCurrentInstance({ id: tpl1 })
  console.log('[01] setCurrentInstance(tpl1) result:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'sci-tpl1')

  await snapshot('assembly')
  return { asmId, tpl1, tpl2, inst1, inst2 }
}
