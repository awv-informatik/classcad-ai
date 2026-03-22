// Q: How do per-job messages work in batch? Each job should have its own result+messages.
export default async function ({ execute }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'Test' }] })).result

  // Batch with proper failing job (invalid ID, not empty param)
  const r1 = await execute({
    'v1.common.batch': [{
      jobs: [
        { api: 'v1.common.getAppVersion' },
        { api: 'v1.part.box', param: { id: 999999 } },  // invalid ID
        { api: 'v1.common.getClassFileVersion' },
      ]
    }]
  })

  // Check if result is array of sub-results
  console.log('[14] batch result type:', typeof r1.result, Array.isArray(r1.result))
  console.log('[14] batch result length:', r1.result?.length)
  console.log('[14] outer messages:', JSON.stringify(r1.messages))
  console.log('[14] outer maxLevel:', r1.maxLevel)

  if (Array.isArray(r1.result)) {
    for (let i = 0; i < r1.result.length; i++) {
      const sub = r1.result[i]
      console.log(`[14] job[${i}]:`, JSON.stringify(sub))
    }
  }
}
