// Test: setFacetingParameters with only one param at a time (partial update)
export default async function (api, { filewrite }) {
  // Reset to known state
  await api.v1.common.setFacetingParameters({ angleTol: 0, chordHeightTol: 0.1 })
  const baseline = (await api.v1.common.getFacetingParameters()).result
  console.log('[03] baseline:', JSON.stringify(baseline))

  // Set only angleTol
  await api.v1.common.setFacetingParameters({ angleTol: 25 })
  const afterAngle = (await api.v1.common.getFacetingParameters()).result
  console.log('[03] after setting angleTol only:', JSON.stringify(afterAngle))

  // Set only chordHeightTol
  await api.v1.common.setFacetingParameters({ chordHeightTol: 0.02 })
  const afterChord = (await api.v1.common.getFacetingParameters()).result
  console.log('[03] after setting chordHeightTol only:', JSON.stringify(afterChord))

  filewrite({ baseline, afterAngle, afterChord }, 'partial-updates')
  return { baseline, afterAngle, afterChord }
}
