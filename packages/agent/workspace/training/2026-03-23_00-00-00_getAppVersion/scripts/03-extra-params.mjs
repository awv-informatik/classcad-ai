// Pass extra/unknown parameters — are they silently ignored?
export default async function (api) {
  const r = await api.v1.common.getAppVersion({ foo: 'bar', id: 999, name: 'test' })

  console.log('[03] result:', JSON.stringify(r.result))
  console.log('[03] maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))

  return { version: r.result, maxLevel: r.maxLevel }
}
