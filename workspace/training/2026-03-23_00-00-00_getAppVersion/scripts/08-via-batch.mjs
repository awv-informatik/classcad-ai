// Call getAppVersion via batch — does it work the same way?
export default async function (api) {
  const r = await api.v1.common.batch({
    jobs: [
      { api: 'v1.common.getAppVersion' },
      { api: 'v1.common.getClassFileVersion' },
    ],
  })

  console.log('[08] batch maxLevel:', r.maxLevel)
  console.log('[08] batch result count:', r.result.length)
  console.log('[08] job0 result:', JSON.stringify(r.result[0].result))
  console.log('[08] job1 result:', JSON.stringify(r.result[1].result))
  console.log('[08] job0 keys:', Object.keys(r.result[0]).join(', '))

  return { batchResults: r.result }
}
