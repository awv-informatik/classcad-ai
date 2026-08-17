// Bad API name in a job — what error? (null-safe version)
export default async function (api, { filewrite }) {
  const r = await api.v1.common.batch({
    jobs: [
      { api: 'v1.common.getAppVersion' },
      { api: 'v1.fake.nonexistent' },
      { api: 'v1.common.getClassFileVersion' },
    ],
  })
  console.log('[07] outer maxLevel:', r.maxLevel)
  console.log('[07] result count:', r.result.length)
  for (let i = 0; i < r.result.length; i++) {
    const j = r.result[i]
    if (j === null) {
      console.log(`[07] job${i}: NULL (entire job result is null)`)
    } else {
      console.log(`[07] job${i} result:`, JSON.stringify(j.result))
      console.log(`[07] job${i} keys:`, Object.keys(j).join(', '))
      if (j.messages && j.messages.length) {
        console.log(`[07] job${i} messages:`, JSON.stringify(j.messages))
      }
    }
  }
  filewrite(r, 'bad-api-batch')
  return { outerMaxLevel: r.maxLevel }
}
