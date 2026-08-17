// Single job — still returns array?
export default async function (api) {
  const r = await api.v1.common.batch({
    jobs: [{ api: 'v1.common.getAppVersion' }],
  })
  console.log('[04] single job result is array:', Array.isArray(r.result))
  console.log('[04] single job result length:', r.result.length)
  console.log('[04] single job result[0]:', JSON.stringify(r.result[0]))
  return { isArray: Array.isArray(r.result), length: r.result.length }
}
