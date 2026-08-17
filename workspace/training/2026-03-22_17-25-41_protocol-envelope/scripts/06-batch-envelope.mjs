// 06 — Batch envelope: nested envelopes inside batch result array
// Also tests: does batch have its own outer envelope?

export default async function (api) {
  const batch = await api.v1.common.batch({
      jobs: [
        { api: 'v1.common.getAppVersion' },
        { api: 'v1.common.evaluateExpression', param: { expression: '7*6' } },
        { api: 'v1.common.evaluateExpression', param: { expression: 'bad expr' } },
        { api: 'v1.common.getClassFileVersion' },
      ]
    })

  console.log('[batch] outer keys:', Object.keys(batch))
  console.log('[batch] outer maxLevel:', batch.maxLevel)
  console.log('[batch] outer messages:', JSON.stringify(batch.messages))
  console.log('[batch] result is array:', Array.isArray(batch.result))
  console.log('[batch] result length:', batch.result?.length)

  if (Array.isArray(batch.result)) {
    for (let i = 0; i < batch.result.length; i++) {
      const r = batch.result[i]
      console.log(`[batch][${i}] keys:`, Object.keys(r))
      console.log(`[batch][${i}] result:`, JSON.stringify(r.result))
      console.log(`[batch][${i}] messages:`, JSON.stringify(r.messages))
      console.log(`[batch][${i}] maxLevel:`, r.maxLevel)
    }
  }

  return {}
}
