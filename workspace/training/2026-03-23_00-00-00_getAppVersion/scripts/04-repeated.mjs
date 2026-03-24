// Call multiple times — is result stable?
export default async function (api) {
  const results = []
  for (let i = 0; i < 5; i++) {
    const r = await api.v1.common.getAppVersion({})
    results.push(r.result)
  }

  const allSame = results.every((v) => v === results[0])
  console.log('[04] results:', JSON.stringify(results))
  console.log('[04] all identical:', allSame)

  return { results, allSame }
}
