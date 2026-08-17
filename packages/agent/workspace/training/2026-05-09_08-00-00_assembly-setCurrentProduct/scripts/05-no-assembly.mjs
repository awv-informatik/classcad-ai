export default async function (api, { snapshot, filewrite }) {
  // Test 1: call setCurrentProduct with just a part (no assembly)
  const partId = (await api.v1.part.create({ name: 'JustAPart' })).result
  await api.v1.part.box({ id: partId, length: 50, width: 40, height: 30 })
  console.log('[05] partId:', partId)

  const r1 = await api.v1.assembly.setCurrentProduct({ id: partId })
  console.log('[05] setCurrentProduct(partId) no-asm result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ context: 'no-assembly', result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'no-asm')

  // Test 2: does setCurrentProduct interact with setCurrentInstance?
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Tpl' })).result
  await api.v1.part.box({ id: tplId, length: 30, width: 20, height: 10 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const instId = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  console.log('[05] asmId:', asmId, 'tplId:', tplId, 'instId:', instId)

  // setCurrentInstance navigates to instance's template
  await api.v1.assembly.setCurrentInstance({ id: instId })
  // Now setCurrentProduct should return tplId (what setCurrentInstance set)
  const r2 = await api.v1.assembly.setCurrentProduct({ id: asmId })
  console.log('[05] after setCurrentInstance(inst), setCurrentProduct(asm) returns:', r2.result, '(expected tplId:', tplId, ')')
  filewrite({ context: 'after-setCurrentInstance', result: r2.result, expected: tplId, match: r2.result === tplId }, 'interaction')

  // Reverse: does setCurrentProduct affect what setCurrentInstance returns?
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  // Then switch instance to assembly root
  const r3 = await api.v1.assembly.setCurrentInstance({ id: asmId })
  console.log('[05] after setCurrentProduct(tpl), setCurrentInstance(asm) result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ context: 'product-then-instance', result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }, 'reverse')

  return { partId, asmId, tplId, instId }
}
