// Batch with param objects — evaluateExpression needs a param
export default async function (api) {
  const r = await api.v1.common.batch({
    jobs: [
      { api: 'v1.common.getAppVersion' },
      { api: 'v1.common.evaluateExpression', param: { expression: '6*7' } },
      { api: 'v1.common.evaluateExpression', param: { expression: '100+200' } },
    ],
  })
  console.log('[02] job0 (getAppVersion):', JSON.stringify(r.result[0].result))
  console.log('[02] job1 (6*7):', JSON.stringify(r.result[1].result))
  console.log('[02] job2 (100+200):', JSON.stringify(r.result[2].result))
  console.log('[02] outer maxLevel:', r.maxLevel)
  return { results: r.result.map(j => j.result) }
}
