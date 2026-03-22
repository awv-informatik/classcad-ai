// 11 — Parameter passing variants
// How does the harness pass params? The execute signature is { 'api': [{ params }] }
// What happens with: empty array [], no params object, null

export default async function ({ execute }) {
  // Normal: [{}]
  const a = await execute({ 'v1.common.getAppVersion': [{}] })
  console.log('[params] [{}] result:', JSON.stringify(a.result), 'maxLevel:', a.maxLevel)

  // Empty array: []
  const b = await execute({ 'v1.common.getAppVersion': [] })
  console.log('[params] [] result:', JSON.stringify(b.result), 'maxLevel:', b.maxLevel)

  // No value (undefined)
  const c = await execute({ 'v1.common.getAppVersion': undefined })
  console.log('[params] undefined result:', JSON.stringify(c.result), 'maxLevel:', c.maxLevel)

  return {}
}
