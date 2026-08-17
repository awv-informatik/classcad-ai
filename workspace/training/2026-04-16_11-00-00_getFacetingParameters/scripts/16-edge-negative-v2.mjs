// Test: negative values — BOTH params always provided
export default async function (api, { filewrite }) {
  // Reset
  await api.v1.common.setFacetingParameters({ angleTol: 10, chordHeightTol: 0.3 })
  const baseline = (await api.v1.common.getFacetingParameters()).result
  console.log('[16] baseline:', JSON.stringify(baseline))

  // Negative chordHeightTol
  const r1 = await api.v1.common.setFacetingParameters({ angleTol: 10, chordHeightTol: -0.5 })
  console.log('[16] neg chordHeightTol — maxLevel:', r1.maxLevel)
  const after1 = (await api.v1.common.getFacetingParameters()).result
  console.log('[16] after neg chordHeightTol:', JSON.stringify(after1))

  // Negative angleTol
  const r2 = await api.v1.common.setFacetingParameters({ angleTol: -10, chordHeightTol: 0.3 })
  console.log('[16] neg angleTol — maxLevel:', r2.maxLevel)
  const after2 = (await api.v1.common.getFacetingParameters()).result
  console.log('[16] after neg angleTol:', JSON.stringify(after2))

  // Both negative
  const r3 = await api.v1.common.setFacetingParameters({ angleTol: -5, chordHeightTol: -1 })
  console.log('[16] both neg — maxLevel:', r3.maxLevel)
  const after3 = (await api.v1.common.getFacetingParameters()).result
  console.log('[16] after both neg:', JSON.stringify(after3))

  filewrite({ baseline, after1, after2, after3, r1ml: r1.maxLevel, r2ml: r2.maxLevel, r3ml: r3.maxLevel }, 'edge-negative-v2')
  return { after1, after2, after3 }
}
