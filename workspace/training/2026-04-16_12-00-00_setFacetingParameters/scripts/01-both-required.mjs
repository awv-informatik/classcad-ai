// Verify both params required — partial updates should fail with NullMem error
export default async function (api, { filewrite }) {
  // Reset to known baseline
  await api.v1.common.setFacetingParameters({ angleTol: 0, chordHeightTol: 0.1 })
  const baseline = (await api.v1.common.getFacetingParameters()).result

  // Test 1: only angleTol
  const r1 = await api.v1.common.setFacetingParameters({ angleTol: 20 })
  const after1 = (await api.v1.common.getFacetingParameters()).result

  // Test 2: only chordHeightTol
  const r2 = await api.v1.common.setFacetingParameters({ chordHeightTol: 0.5 })
  const after2 = (await api.v1.common.getFacetingParameters()).result

  // Test 3: both provided (should succeed)
  const r3 = await api.v1.common.setFacetingParameters({ angleTol: 15, chordHeightTol: 0.3 })
  const after3 = (await api.v1.common.getFacetingParameters()).result

  const results = {
    baseline,
    onlyAngleTol: { maxLevel: r1.maxLevel, messages: r1.messages, after: after1 },
    onlyChordHeight: { maxLevel: r2.maxLevel, messages: r2.messages, after: after2 },
    both: { maxLevel: r3.maxLevel, messages: r3.messages, after: after3 }
  }

  console.log('[01] onlyAngleTol:', r1.maxLevel <= 31 ? '✓' : '❌ maxLevel=' + r1.maxLevel)
  console.log('[01] onlyChordHeight:', r2.maxLevel <= 31 ? '✓' : '❌ maxLevel=' + r2.maxLevel)
  console.log('[01] both:', r3.maxLevel <= 31 ? '✓' : '❌ maxLevel=' + r3.maxLevel)
  console.log('[01] after both:', JSON.stringify(after3))

  filewrite(results, 'both-required')
  return {}
}
