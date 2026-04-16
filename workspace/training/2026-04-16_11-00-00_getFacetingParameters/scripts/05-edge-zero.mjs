// Test: edge cases — zero values
export default async function (api, { filewrite }) {
  // Reset
  await api.v1.common.setFacetingParameters({ angleTol: 10, chordHeightTol: 0.3 })
  const baseline = (await api.v1.common.getFacetingParameters()).result
  console.log('[05] baseline:', JSON.stringify(baseline))

  // Zero chordHeightTol — should be error per setDatabaseSettings LLM doc
  const zeroChordR = await api.v1.common.setFacetingParameters({ chordHeightTol: 0 })
  console.log('[05] zero chordHeightTol result:', zeroChordR.result)
  console.log('[05] zero chordHeightTol maxLevel:', zeroChordR.maxLevel)
  console.log('[05] zero chordHeightTol messages:', JSON.stringify(zeroChordR.messages))
  const afterZeroChord = (await api.v1.common.getFacetingParameters()).result
  console.log('[05] after zero chordHeightTol:', JSON.stringify(afterZeroChord))

  // Zero angleTol — this should be fine (0 = disabled)
  const zeroAngleR = await api.v1.common.setFacetingParameters({ angleTol: 0 })
  console.log('[05] zero angleTol result:', zeroAngleR.result)
  console.log('[05] zero angleTol maxLevel:', zeroAngleR.maxLevel)
  const afterZeroAngle = (await api.v1.common.getFacetingParameters()).result
  console.log('[05] after zero angleTol:', JSON.stringify(afterZeroAngle))

  filewrite({
    baseline,
    zeroChord: { result: zeroChordR.result, maxLevel: zeroChordR.maxLevel, messages: zeroChordR.messages },
    afterZeroChord,
    zeroAngle: { result: zeroAngleR.result, maxLevel: zeroAngleR.maxLevel },
    afterZeroAngle,
  }, 'edge-zero')
  return { afterZeroChord, afterZeroAngle }
}
