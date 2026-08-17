export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ErrorTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 60, width: 40, height: 30 })).result
  console.log('[02] partId:', partId, 'boxId:', boxId)

  // Test 1: feature ID instead of part ID
  const r1 = await api.v1.part.operationMoveToEnd({ id: boxId })
  console.log('[02] moveToEnd(featureId) — result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'wrong-type')

  // Test 2: non-existent ID
  const r2 = await api.v1.part.operationMoveToEnd({ id: 999999 })
  console.log('[02] moveToEnd(999999) — result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'nonexistent')

  // Test 3: zero ID
  const r3 = await api.v1.part.operationMoveToEnd({ id: 0 })
  console.log('[02] moveToEnd(0) — result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'zero-id')

  // Test 4: no id param at all
  const r4 = await api.v1.part.operationMoveToEnd({})
  console.log('[02] moveToEnd({}) — result:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'missing-id')

  return { partId }
}
