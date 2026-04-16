// Test: getFacetingParameters defaults — what comes back on a fresh worker?
export default async function (api, { filewrite }) {
  const r = await api.v1.common.getFacetingParameters()
  console.log('[01] result:', JSON.stringify(r.result))
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  console.log('[01] result keys:', Object.keys(r.result).sort().join(', '))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'defaults')
  return r.result
}
