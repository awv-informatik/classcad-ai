// Error in middle job — do subsequent jobs still run?
export default async function (api, { filewrite }) {
  const r = await api.v1.common.batch({
    jobs: [
      { api: 'v1.common.getAppVersion' },
      { api: 'v1.common.evaluateExpression', param: { expression: 'INVALID!!!' } },
      { api: 'v1.common.getClassFileVersion' },
    ],
  })
  console.log('[06] outer maxLevel:', r.maxLevel)
  console.log('[06] result count:', r.result.length)
  for (let i = 0; i < r.result.length; i++) {
    const j = r.result[i]
    console.log(`[06] job${i} result:`, JSON.stringify(j.result))
    console.log(`[06] job${i} maxLevel:`, j.maxLevel !== undefined ? j.maxLevel : 'N/A')
  }
  filewrite(r, 'error-batch')
  return { outerMaxLevel: r.maxLevel, jobCount: r.result.length }
}
