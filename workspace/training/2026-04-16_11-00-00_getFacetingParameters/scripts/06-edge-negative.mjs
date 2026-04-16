// Test: edge cases — negative values
export default async function (api, { filewrite }) {
  // Reset to known
  await api.v1.common.setFacetingParameters({ angleTol: 10, chordHeightTol: 0.3 })
  const baseline = (await api.v1.common.getFacetingParameters()).result
  console.log('[06] baseline:', JSON.stringify(baseline))

  // Negative chordHeightTol — per setDatabaseSettings doc, silently ignored
  const negChordR = await api.v1.common.setFacetingParameters({ chordHeightTol: -0.5 })
  console.log('[06] neg chordHeightTol maxLevel:', negChordR.maxLevel)
  const afterNegChord = (await api.v1.common.getFacetingParameters()).result
  console.log('[06] after neg chordHeightTol:', JSON.stringify(afterNegChord))

  // Negative angleTol
  const negAngleR = await api.v1.common.setFacetingParameters({ angleTol: -10 })
  console.log('[06] neg angleTol maxLevel:', negAngleR.maxLevel)
  const afterNegAngle = (await api.v1.common.getFacetingParameters()).result
  console.log('[06] after neg angleTol:', JSON.stringify(afterNegAngle))

  filewrite({
    baseline,
    negChord: { maxLevel: negChordR.maxLevel, messages: negChordR.messages },
    afterNegChord,
    negAngle: { maxLevel: negAngleR.maxLevel, messages: negAngleR.messages },
    afterNegAngle,
  }, 'edge-negative')
  return { afterNegChord, afterNegAngle }
}
