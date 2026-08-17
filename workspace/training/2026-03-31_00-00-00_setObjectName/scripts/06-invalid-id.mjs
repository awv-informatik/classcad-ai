// 06 — Invalid/nonexistent ID
export default async function (api, { filewrite }) {
  // Try with a bogus ID
  const r1 = await api.v1.common.setObjectName({ id: 99999, name: 'Nope' })
  console.log('[06] bogus ID 99999 → result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[06] messages:', JSON.stringify(r1.messages))

  // Try with ID 0
  const r2 = await api.v1.common.setObjectName({ id: 0, name: 'Zero' })
  console.log('[06] ID 0 → result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[06] messages:', JSON.stringify(r2.messages))

  // Try with negative ID
  const r3 = await api.v1.common.setObjectName({ id: -1, name: 'Negative' })
  console.log('[06] ID -1 → result:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[06] messages:', JSON.stringify(r3.messages))

  filewrite({
    bogusId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    zeroId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    negativeId: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }
  }, 'invalid-id-results')

  return {}
}
