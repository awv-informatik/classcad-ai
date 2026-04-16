// Test: edge cases with zero — BOTH params always provided
export default async function (api, { filewrite }) {
  // Reset to known non-default
  await api.v1.common.setFacetingParameters({ angleTol: 10, chordHeightTol: 0.3 })
  const baseline = (await api.v1.common.getFacetingParameters()).result
  console.log('[15] baseline:', JSON.stringify(baseline))

  // Zero chordHeightTol (keep angleTol valid)
  const r1 = await api.v1.common.setFacetingParameters({ angleTol: 10, chordHeightTol: 0 })
  console.log('[15] zero chordHeightTol — maxLevel:', r1.maxLevel, 'messages:', JSON.stringify(r1.messages?.map(m => m.message)))
  const after1 = (await api.v1.common.getFacetingParameters()).result
  console.log('[15] after zero chordHeightTol:', JSON.stringify(after1))

  // Reset
  await api.v1.common.setFacetingParameters({ angleTol: 10, chordHeightTol: 0.3 })

  // Zero angleTol (keep chordHeightTol valid) — 0 = disabled, should be OK
  const r2 = await api.v1.common.setFacetingParameters({ angleTol: 0, chordHeightTol: 0.3 })
  console.log('[15] zero angleTol — maxLevel:', r2.maxLevel)
  const after2 = (await api.v1.common.getFacetingParameters()).result
  console.log('[15] after zero angleTol:', JSON.stringify(after2))

  // Both zero
  const r3 = await api.v1.common.setFacetingParameters({ angleTol: 0, chordHeightTol: 0 })
  console.log('[15] both zero — maxLevel:', r3.maxLevel, 'messages:', JSON.stringify(r3.messages?.map(m => m.message)))
  const after3 = (await api.v1.common.getFacetingParameters()).result
  console.log('[15] after both zero:', JSON.stringify(after3))

  filewrite({ baseline, after1, after2, after3, r1ml: r1.maxLevel, r2ml: r2.maxLevel, r3ml: r3.maxLevel }, 'edge-zero-v2')
  return { after1, after2, after3 }
}
