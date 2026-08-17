// Verify negative values silently ignored + zero edge cases
export default async function (api, { filewrite }) {
  const results = {}

  // Test 1: negative angleTol — should be silently ignored
  await api.v1.common.setFacetingParameters({ angleTol: 10, chordHeightTol: 0.3 })
  const r1 = await api.v1.common.setFacetingParameters({ angleTol: -5, chordHeightTol: 0.3 })
  const after1 = (await api.v1.common.getFacetingParameters()).result
  results.negAngleTol = { maxLevel: r1.maxLevel, after: after1, unchanged: after1.angleTol === 10 }
  console.log('[03] neg angleTol:', r1.maxLevel, 'unchanged:', after1.angleTol === 10)

  // Test 2: negative chordHeightTol — should be silently ignored
  await api.v1.common.setFacetingParameters({ angleTol: 10, chordHeightTol: 0.3 })
  const r2 = await api.v1.common.setFacetingParameters({ angleTol: 10, chordHeightTol: -0.5 })
  const after2 = (await api.v1.common.getFacetingParameters()).result
  results.negChordHeight = { maxLevel: r2.maxLevel, after: after2, unchanged: after2.chordHeightTol === 0.3 }
  console.log('[03] neg chordHeight:', r2.maxLevel, 'unchanged:', after2.chordHeightTol === 0.3)

  // Test 3: both zero — should fail
  const r3 = await api.v1.common.setFacetingParameters({ angleTol: 0, chordHeightTol: 0 })
  results.bothZero = { maxLevel: r3.maxLevel, messages: r3.messages }
  console.log('[03] both zero:', r3.maxLevel <= 31 ? '✓ (unexpected!)' : '❌ rejected as expected')

  // Test 4: zero chordHeightTol with angleTol > 0 — should succeed
  const r4 = await api.v1.common.setFacetingParameters({ angleTol: 10, chordHeightTol: 0 })
  const after4 = (await api.v1.common.getFacetingParameters()).result
  results.zeroChordWithAngle = { maxLevel: r4.maxLevel, after: after4 }
  console.log('[03] zero cht + angleTol>0:', r4.maxLevel <= 31 ? '✓' : '❌', 'cht=', after4.chordHeightTol)

  filewrite(results, 'negatives-zeros')
  return {}
}
