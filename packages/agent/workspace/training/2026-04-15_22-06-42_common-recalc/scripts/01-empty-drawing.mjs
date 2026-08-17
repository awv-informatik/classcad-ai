// Test recalc on an empty drawing (no objects created)
export default async function (api, { filewrite }) {
  // Call recalc with no geometry present
  const r = await api.v1.common.recalc()
  console.log('[01] recalc result:', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'recalc-empty')
  return { result: r.result, maxLevel: r.maxLevel }
}
