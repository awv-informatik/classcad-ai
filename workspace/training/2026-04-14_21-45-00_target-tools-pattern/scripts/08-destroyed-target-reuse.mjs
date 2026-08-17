// Test: What happens when you use a destroyed target ID in subsequent operations?
// From script 07: intersection destroyed the target, but merge on same ID succeeded.
// Is the ID truly invalid, or does it remain addressable?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DestroyedTarget' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create target + non-overlapping tool to guarantee intersection destroys target
  const target = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  const tool = (await api.v1.solid.box({ id: eifId, length: 20, width: 20, height: 20, translation: [200, 200, 200] })).result

  console.log('[08] target ID:', target, 'tool ID:', tool)

  // Intersection of non-overlapping bodies — should destroy target
  const rInt = await api.v1.solid.intersection({ id: eifId, target, tools: [tool] })
  console.log('[08] intersection: result=', rInt.result, 'maxLevel=', rInt.maxLevel)
  console.log('[08] intersection messages:', JSON.stringify(rInt.messages))

  // Now try various operations on the destroyed target ID
  // 1. Translation
  const rMove = await api.v1.solid.translation({ id: eifId, target, translation: [10, 0, 0] })
  console.log('[08] translate destroyed: maxLevel=', rMove.maxLevel, 'msg=', rMove.messages?.[0]?.message)

  // 2. Union with a new box
  const newBox = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30 })).result
  const rUnion = await api.v1.solid.union({ id: eifId, target, tools: [newBox] })
  console.log('[08] union on destroyed: result=', rUnion.result, 'maxLevel=', rUnion.maxLevel, 'msg=', rUnion.messages?.[0]?.message)

  // 3. Merge with another new box
  const newBox2 = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30, translation: [50, 0, 0] })).result
  const rMerge = await api.v1.solid.merge({ id: eifId, target, tools: [newBox2] })
  console.log('[08] merge on destroyed: result=', rMerge.result, 'maxLevel=', rMerge.maxLevel, 'msg=', rMerge.messages?.[0]?.message)

  filewrite({
    intersection: { result: rInt.result, maxLevel: rInt.maxLevel, messages: rInt.messages },
    translate: { maxLevel: rMove.maxLevel, messages: rMove.messages },
    union: { result: rUnion.result, maxLevel: rUnion.maxLevel, messages: rUnion.messages },
    merge: { result: rMerge.result, maxLevel: rMerge.maxLevel, messages: rMerge.messages }
  }, 'destroyed-target-results')

  return { partId }
}
