// NEW test: what happens with extra unknown params alongside valid ones?
export default async function (api, { filewrite }) {
  // Reset baseline
  await api.v1.common.setFacetingParameters({ angleTol: 0, chordHeightTol: 0.1 })

  // Test 1: valid params + extra unknown param
  const r1 = await api.v1.common.setFacetingParameters({
    angleTol: 15, chordHeightTol: 0.2, unknownParam: 42
  })
  const after1 = (await api.v1.common.getFacetingParameters()).result
  console.log('[04] with extra param:', r1.maxLevel <= 31 ? '✓' : '❌', 'maxLevel:', r1.maxLevel)
  console.log('[04] readback:', JSON.stringify(after1))

  // Test 2: valid params + extra param with same name as a databaseSettings param
  await api.v1.common.setFacetingParameters({ angleTol: 0, chordHeightTol: 0.1 })
  const r2 = await api.v1.common.setFacetingParameters({
    angleTol: 10, chordHeightTol: 0.3, facetingParamsMode: 1
  })
  const after2 = (await api.v1.common.getFacetingParameters()).result
  const db2 = (await api.v1.common.getDatabaseSettings()).result
  console.log('[04] with facetingParamsMode:', r2.maxLevel <= 31 ? '✓' : '❌', 'maxLevel:', r2.maxLevel)
  console.log('[04] faceting readback:', JSON.stringify(after2))
  console.log('[04] facetingParamsMode:', db2.facetingParamsMode)

  filewrite({
    withExtraParam: { maxLevel: r1.maxLevel, messages: r1.messages, after: after1 },
    withFacetingParamsMode: { maxLevel: r2.maxLevel, messages: r2.messages, after: after2, dbFacetingMode: db2.facetingParamsMode }
  }, 'extra-params')
  return {}
}
