// Sequential dependency — can job 2 use ID from job 1?
// batch with part.create then a call that needs the part ID
// We can't reference job 1's result in job 2's params directly,
// so test if the drawing state from job 1 is visible to job 2
export default async function (api) {
  const r = await api.v1.common.batch({
    jobs: [
      { api: 'v1.part.create', param: { name: 'BatchPart' } },
      { api: 'v1.common.getAppVersion' },
    ],
  })
  console.log('[05] job0 (part.create) result:', JSON.stringify(r.result[0].result))
  console.log('[05] job1 (getAppVersion) result:', JSON.stringify(r.result[1].result))
  console.log('[05] outer maxLevel:', r.maxLevel)
  // Check: did part.create return an ID?
  const partId = r.result[0].result
  console.log('[05] partId type:', typeof partId)
  return { partId, results: r.result.map(j => j.result) }
}
