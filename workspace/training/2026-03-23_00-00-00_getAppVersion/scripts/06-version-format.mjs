// Inspect version string format in detail
export default async function (api) {
  const r = await api.v1.common.getAppVersion({})
  const v = r.result

  console.log('[06] raw value:', JSON.stringify(v))
  console.log('[06] length:', v.length)
  console.log('[06] has dots:', v.includes('.'))
  console.log('[06] parts:', v.split('.').length)
  console.log('[06] trimmed same:', v.trim() === v)
  console.log('[06] empty:', v === '')

  return { version: v, length: v.length, parts: v.split('.') }
}
