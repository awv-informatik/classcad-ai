// Test: edge cases — very large values
export default async function (api, { filewrite }) {
  // Very large chordHeightTol
  const largeChordR = await api.v1.common.setFacetingParameters({ chordHeightTol: 1000 })
  console.log('[07] large chordHeightTol maxLevel:', largeChordR.maxLevel)
  const afterLargeChord = (await api.v1.common.getFacetingParameters()).result
  console.log('[07] after large chordHeightTol:', JSON.stringify(afterLargeChord))

  // Very large angleTol
  const largeAngleR = await api.v1.common.setFacetingParameters({ angleTol: 360 })
  console.log('[07] large angleTol maxLevel:', largeAngleR.maxLevel)
  const afterLargeAngle = (await api.v1.common.getFacetingParameters()).result
  console.log('[07] after large angleTol:', JSON.stringify(afterLargeAngle))

  // Very small (near-zero) chordHeightTol
  const tinyChordR = await api.v1.common.setFacetingParameters({ chordHeightTol: 0.001 })
  console.log('[07] tiny chordHeightTol maxLevel:', tinyChordR.maxLevel)
  const afterTiny = (await api.v1.common.getFacetingParameters()).result
  console.log('[07] after tiny chordHeightTol:', JSON.stringify(afterTiny))

  filewrite({ afterLargeChord, afterLargeAngle, afterTiny }, 'edge-large')
  return { afterLargeChord, afterLargeAngle, afterTiny }
}
