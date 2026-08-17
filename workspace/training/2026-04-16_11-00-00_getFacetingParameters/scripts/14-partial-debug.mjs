// Test: debug partial update — check maxLevel and messages for single-param calls
export default async function (api, { filewrite }) {
  // Start at known non-default values
  await api.v1.common.setFacetingParameters({ angleTol: 10, chordHeightTol: 0.5 })
  const baseline = (await api.v1.common.getFacetingParameters()).result
  console.log('[14] baseline:', JSON.stringify(baseline))

  // Set only angleTol
  const r1 = await api.v1.common.setFacetingParameters({ angleTol: 30 })
  console.log('[14] set angleTol=30 — result:', r1.result, 'maxLevel:', r1.maxLevel, 'messages:', JSON.stringify(r1.messages))
  const after1 = (await api.v1.common.getFacetingParameters()).result
  console.log('[14] after angleTol=30:', JSON.stringify(after1))

  // Reset
  await api.v1.common.setFacetingParameters({ angleTol: 10, chordHeightTol: 0.5 })

  // Set only chordHeightTol
  const r2 = await api.v1.common.setFacetingParameters({ chordHeightTol: 0.01 })
  console.log('[14] set chordHeightTol=0.01 — result:', r2.result, 'maxLevel:', r2.maxLevel, 'messages:', JSON.stringify(r2.messages))
  const after2 = (await api.v1.common.getFacetingParameters()).result
  console.log('[14] after chordHeightTol=0.01:', JSON.stringify(after2))

  filewrite({
    baseline,
    angleTolOnly: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages, after: after1 },
    chordOnly: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages, after: after2 },
  }, 'partial-debug')
  return { after1, after2 }
}
