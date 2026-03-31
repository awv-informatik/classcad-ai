// 11 — Missing parameters
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result

  // Missing name param
  const r1 = await api.v1.common.setObjectName({ id: partId })
  console.log('[11] missing name → result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[11] messages:', JSON.stringify(r1.messages))

  // Missing id param
  const r2 = await api.v1.common.setObjectName({ name: 'Test' })
  console.log('[11] missing id → result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[11] messages:', JSON.stringify(r2.messages))

  // Empty params
  const r3 = await api.v1.common.setObjectName({})
  console.log('[11] empty params → result:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[11] messages:', JSON.stringify(r3.messages))

  filewrite({
    missingName: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    missingId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    emptyParams: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }
  }, 'missing-params')

  return { partId }
}
