// Basic call — observe the full envelope
export default async function (api, { filewrite }) {
  const r = await api.v1.common.getAppVersion({})

  console.log('[01] result:', JSON.stringify(r.result))
  console.log('[01] result type:', typeof r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  console.log('[01] has structure:', r.structure !== null && r.structure !== undefined)
  console.log('[01] has graphic:', r.graphic !== null && r.graphic !== undefined)
  console.log('[01] envelope keys:', Object.keys(r).join(', '))

  return { version: r.result }
}
