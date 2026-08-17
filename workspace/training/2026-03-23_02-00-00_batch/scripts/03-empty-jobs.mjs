// Empty jobs array — what happens?
export default async function (api) {
  try {
    const r = await api.v1.common.batch({ jobs: [] })
    console.log('[03] empty jobs result:', JSON.stringify(r.result))
    console.log('[03] empty jobs maxLevel:', r.maxLevel)
    console.log('[03] empty jobs type:', typeof r.result)
    return { result: r.result, maxLevel: r.maxLevel }
  } catch (e) {
    console.log('[03] empty jobs error:', e.message)
    return { error: e.message }
  }
}
