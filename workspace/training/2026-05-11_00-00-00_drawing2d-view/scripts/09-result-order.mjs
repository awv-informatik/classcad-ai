export default async function (api, { snapshot, filewrite }) {
  // Test result order mapping: run several different type orderings and see how IDs map to names
  const partId = (await api.v1.part.create({ name: 'Order' })).result
  await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })

  // Test 1: types in reverse alphabetical order
  const r1 = await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'RIGHT', 'FRONT'] })
  const names1 = []
  for (const [nid, node] of Object.entries(r1.structure.tree)) {
    if (node.class === 'CC_View2D') names1.push({ id: parseInt(nid), name: node.name })
  }
  names1.sort((a, b) => a.id - b.id)
  console.log('[09] input: TOP,RIGHT,FRONT')
  console.log('[09] result IDs:', JSON.stringify(r1.result))
  console.log('[09] tree order:', JSON.stringify(names1))

  // Test 2: single type
  const r2 = await api.v1.drawing2d.view({ id: partId, types: ['ISO'] })
  console.log('[09] input: ISO, result:', JSON.stringify(r2.result))

  // Test 3: two types
  const r3 = await api.v1.drawing2d.view({ id: partId, types: ['BACK', 'LEFT'] })
  const names3 = []
  for (const [nid, node] of Object.entries(r3.structure.tree)) {
    if (node.class === 'CC_View2D') names3.push({ id: parseInt(nid), name: node.name })
  }
  names3.sort((a, b) => a.id - b.id)
  console.log('[09] input: BACK,LEFT')
  console.log('[09] result IDs:', JSON.stringify(r3.result))
  console.log('[09] tree order:', JSON.stringify(names3))

  // Test 4: reversed pair
  const r4 = await api.v1.drawing2d.view({ id: partId, types: ['LEFT', 'BACK'] })
  const names4 = []
  for (const [nid, node] of Object.entries(r4.structure.tree)) {
    if (node.class === 'CC_View2D') names4.push({ id: parseInt(nid), name: node.name })
  }
  names4.sort((a, b) => a.id - b.id)
  console.log('[09] input: LEFT,BACK')
  console.log('[09] result IDs:', JSON.stringify(r4.result))
  console.log('[09] tree order:', JSON.stringify(names4))

  filewrite({
    test1: { input: ['TOP', 'RIGHT', 'FRONT'], resultIds: r1.result, treeOrder: names1 },
    test2: { input: ['ISO'], resultIds: r2.result },
    test3: { input: ['BACK', 'LEFT'], resultIds: r3.result, treeOrder: names3 },
    test4: { input: ['LEFT', 'BACK'], resultIds: r4.result, treeOrder: names4 }
  }, 'order-tests')

  return { partId }
}
