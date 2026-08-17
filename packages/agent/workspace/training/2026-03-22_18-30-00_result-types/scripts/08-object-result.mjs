// Test: object result type — getDatabaseSettings, getFacetingParameters
// Are booleans always 1/0? What other object shapes exist?
export default async function (api) {
  const r1 = await api.v1.common.getDatabaseSettings({})
  console.log(`[object] dbSettings: type=${typeof r1.result} keys=${JSON.stringify(Object.keys(r1.result||{}))}`)
  console.log(`[object] dbSettings full: ${JSON.stringify(r1.result)}`)

  const r2 = await api.v1.common.getFacetingParameters({})
  console.log(`[object] facetingParams: type=${typeof r2.result} keys=${JSON.stringify(Object.keys(r2.result||{}))}`)
  console.log(`[object] facetingParams full: ${JSON.stringify(r2.result)}`)

  // Analyze boolean fields in dbSettings
  const s = r1.result
  if (s) {
    for (const [k, v] of Object.entries(s)) {
      console.log(`[object] dbSettings.${k}: value=${v} type=${typeof v} ===true:${v===true} ===false:${v===false} ===1:${v===1} ===0:${v===0}`)
    }
  }

  return {}
}
