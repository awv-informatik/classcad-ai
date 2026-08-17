export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoolNaming' })).result

  // Test 1: default name (should be "Union" per docs)
  const box1 = (await api.v1.part.box({ id: partId, name: 'A', length: 80, width: 60, height: 40 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'B', length: 40, width: 30, height: 60, translation: [50, 20, 0] })).result
  const b1 = (await api.v1.part.boolean({ id: partId, type: 'UNION', target: box1, tools: [box2] })).result

  // Test 2: custom name
  const box3 = (await api.v1.part.box({ id: partId, name: 'C', length: 60, width: 40, height: 30 })).result
  const cyl1 = (await api.v1.part.cylinder({ id: partId, name: 'D', diameter: 20, height: 50, translation: [30, 20, -5] })).result
  const b2 = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', name: 'MySubtract', target: box3, tools: [cyl1] })).result

  // Test 3: default name for subtraction (should be "Subtraction")
  const box4 = (await api.v1.part.box({ id: partId, name: 'E', length: 50, width: 50, height: 50 })).result
  const box5 = (await api.v1.part.box({ id: partId, name: 'F', length: 30, width: 30, height: 60, translation: [10, 10, 0] })).result
  const b3 = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', target: box4, tools: [box5] })).result

  // Test 4: default name for intersection
  const box6 = (await api.v1.part.box({ id: partId, name: 'G', length: 60, width: 40, height: 40 })).result
  const box7 = (await api.v1.part.box({ id: partId, name: 'H', length: 40, width: 60, height: 30, translation: [20, -10, 5] })).result
  const b4 = (await api.v1.part.boolean({ id: partId, type: 'INTERSECTION', target: box6, tools: [box7] })).result

  console.log('[09] union (default name) id:', b1)
  console.log('[09] subtraction (custom name) id:', b2)
  console.log('[09] subtraction (default name) id:', b3)
  console.log('[09] intersection (default name) id:', b4)

  // Dump structure to see feature names in the tree
  const save = await api.v1.common.save({ format: 'OFB', encoding: 'base64' })
  filewrite({ b1, b2, b3, b4 }, 'bool-ids')

  return { partId }
}
