// Repeated calls — stable result?
export default async function (api) {
  const results = []
  for (let i = 0; i < 5; i++) {
    const r = await api.v1.common.getClassFileVersion({})
    results.push(r.result)
  }
  const allSame = results.every(v => v === results[0])
  console.log('[04] results:', JSON.stringify(results))
  console.log('[04] all same:', allSame)
  return { results, allSame }
}
