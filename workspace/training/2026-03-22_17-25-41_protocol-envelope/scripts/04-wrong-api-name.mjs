// 04 — What happens with a completely wrong API name?
// Does the harness throw? Does the server return an error envelope?

export default async function ({ execute }) {
  try {
    const res = await execute({ 'v1.common.doesNotExist': [{}] })
    console.log('[wrong-api] result:', JSON.stringify(res, null, 2))
  } catch (e) {
    console.log('[wrong-api] threw:', e.message)
    console.log('[wrong-api] error type:', e.constructor.name)
  }

  // Also try a totally bogus namespace
  try {
    const res2 = await execute({ 'v1.bogus.fake': [{}] })
    console.log('[wrong-ns] result:', JSON.stringify(res2, null, 2))
  } catch (e) {
    console.log('[wrong-ns] threw:', e.message)
  }

  return {}
}
