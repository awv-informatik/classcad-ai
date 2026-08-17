// Basic call — observe full envelope
export default async function (api) {
  const r = await api.v1.common.getClassFileVersion({})
  console.log('[01] result:', JSON.stringify(r.result))
  console.log('[01] result type:', typeof r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  console.log('[01] envelope keys:', Object.keys(r).join(', '))
  return { result: r.result, maxLevel: r.maxLevel }
}
