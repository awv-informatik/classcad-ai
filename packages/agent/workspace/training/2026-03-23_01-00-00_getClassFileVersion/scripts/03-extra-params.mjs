// Call with extra/unknown parameters — silently ignored?
export default async function (api) {
  const r = await api.v1.common.getClassFileVersion({ foo: 'bar', id: 'fake123' })
  console.log('[03] extra params result:', JSON.stringify(r.result))
  console.log('[03] extra params maxLevel:', r.maxLevel)
  return { result: r.result, maxLevel: r.maxLevel }
}
