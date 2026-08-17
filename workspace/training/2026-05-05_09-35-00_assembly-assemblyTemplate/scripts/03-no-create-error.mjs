export default async function (api, { filewrite }) {
  // Try calling assemblyTemplate WITHOUT assembly.create first
  const r = await api.v1.assembly.assemblyTemplate({ name: 'ShouldFail' })
  console.log('[03] assemblyTemplate without create result:', r.result)
  console.log('[03] maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'no-create-error')
  return { result: r.result }
}
