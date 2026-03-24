// Inspect per-job envelope shape in detail — do inner results have messages/maxLevel?
export default async function (api, { filewrite }) {
  // Use a mix: one that succeeds cleanly, one with expression
  const r = await api.v1.common.batch({
    jobs: [
      { api: 'v1.common.getAppVersion' },
      { api: 'v1.common.evaluateExpression', param: { expression: '2+3' } },
      { api: 'v1.part.create', param: { name: 'EnvelopeTest' } },
    ],
  })
  console.log('[08] outer keys:', Object.keys(r).join(', '))
  for (let i = 0; i < r.result.length; i++) {
    const j = r.result[i]
    console.log(`[08] job${i} keys:`, Object.keys(j).join(', '))
    console.log(`[08] job${i} has messages:`, 'messages' in j)
    console.log(`[08] job${i} has maxLevel:`, 'maxLevel' in j)
  }
  filewrite(r, 'per-job-envelope')
  return { jobKeys: r.result.map(j => Object.keys(j)) }
}
