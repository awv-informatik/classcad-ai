// Basic batch — two stateless queries, inspect full outer + inner envelopes
export default async function (api, { filewrite }) {
  const r = await api.v1.common.batch({
    jobs: [
      { api: 'v1.common.getAppVersion' },
      { api: 'v1.common.getClassFileVersion' },
    ],
  })
  console.log('[01] outer envelope keys:', Object.keys(r).join(', '))
  console.log('[01] outer maxLevel:', r.maxLevel)
  console.log('[01] outer messages:', JSON.stringify(r.messages))
  console.log('[01] result is array:', Array.isArray(r.result))
  console.log('[01] result length:', r.result.length)
  console.log('[01] job0 keys:', Object.keys(r.result[0]).join(', '))
  console.log('[01] job0 result:', JSON.stringify(r.result[0].result))
  console.log('[01] job1 result:', JSON.stringify(r.result[1].result))
  filewrite(r, 'full-envelope')
  return { outerKeys: Object.keys(r), jobCount: r.result.length }
}
