export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EmptyTest' })).result

  // No user data set — what does getUserDataKeys return?
  const r = await api.v1.common.getUserDataKeys({ id: partId })
  console.log('[03] empty result:', JSON.stringify(r.result))
  console.log('[03] result type:', typeof r.result, Array.isArray(r.result) ? '(array)' : '')
  console.log('[03] maxLevel:', r.maxLevel)
  console.log('[03] is null?', r.result === null)
  console.log('[03] length:', r.result?.length)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'empty-response')

  return { partId }
}
