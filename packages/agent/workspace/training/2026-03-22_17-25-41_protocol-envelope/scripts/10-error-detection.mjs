// 10 — Error detection patterns: maxLevel thresholds
// Can we get warnings (level 41)? What about info messages (level 31)?

export default async function (api) {
  // Create a part and try to do something that might warn
  const part = await api.v1.part.create({ name: 'WarnTest' })

  // Call with wrong ID type — a string where an id is expected
  const wrongId = await api.v1.sketch.create({ id: 'not-a-real-id' })
  console.log('[wrongId] result:', JSON.stringify(wrongId.result))
  console.log('[wrongId] messages:', JSON.stringify(wrongId.messages, null, 2))
  console.log('[wrongId] maxLevel:', wrongId.maxLevel)

  // Pass an ID that doesn't exist (numeric but wrong)
  const badId = await api.v1.sketch.create({ id: 999999 })
  console.log('[badId] result:', JSON.stringify(badId.result))
  console.log('[badId] messages:', JSON.stringify(badId.messages, null, 2))
  console.log('[badId] maxLevel:', badId.maxLevel)

  // Pass boolean TRUE as string "TRUE" where docs say boolean
  const boolStr = await api.v1.common.evaluateExpression({ expression: '1+1', silent: 'TRUE' })
  console.log('[boolStr] result:', boolStr.result)
  console.log('[boolStr] messages:', JSON.stringify(boolStr.messages))
  console.log('[boolStr] maxLevel:', boolStr.maxLevel)

  return {}
}
