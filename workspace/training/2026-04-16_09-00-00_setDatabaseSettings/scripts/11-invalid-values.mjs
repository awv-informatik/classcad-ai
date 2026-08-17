// Test edge cases: invalid values, negative numbers, wrong types, empty params
export default async function (api, { filewrite }) {
  // Reset to known state
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.1, angleTol: 0, facetingParamsMode: 1 })

  const results = {}

  // Empty params object
  const r1 = await api.v1.common.setDatabaseSettings({})
  results.emptyParams = { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }
  console.log('[11] empty params: result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Negative chordHeightTol
  const r2 = await api.v1.common.setDatabaseSettings({ chordHeightTol: -0.5 })
  const afterNeg = (await api.v1.common.getDatabaseSettings()).result
  results.negativeChord = { result: r2.result, maxLevel: r2.maxLevel, chord: afterNeg.chordHeightTol }
  console.log('[11] negative chord: result:', r2.result, 'maxLevel:', r2.maxLevel, 'value:', afterNeg.chordHeightTol)

  // Zero chordHeightTol
  const r3 = await api.v1.common.setDatabaseSettings({ chordHeightTol: 0 })
  const afterZero = (await api.v1.common.getDatabaseSettings()).result
  results.zeroChord = { result: r3.result, maxLevel: r3.maxLevel, chord: afterZero.chordHeightTol }
  console.log('[11] zero chord: result:', r3.result, 'maxLevel:', r3.maxLevel, 'value:', afterZero.chordHeightTol)

  // Invalid facetingParamsMode (3)
  const r4 = await api.v1.common.setDatabaseSettings({ facetingParamsMode: 3 })
  const afterMode3 = (await api.v1.common.getDatabaseSettings()).result
  results.mode3 = { result: r4.result, maxLevel: r4.maxLevel, mode: afterMode3.facetingParamsMode }
  console.log('[11] mode=3: result:', r4.result, 'maxLevel:', r4.maxLevel, 'value:', afterMode3.facetingParamsMode)

  // Negative facetingParamsMode
  const r5 = await api.v1.common.setDatabaseSettings({ facetingParamsMode: -1 })
  const afterModeNeg = (await api.v1.common.getDatabaseSettings()).result
  results.modeNeg = { result: r5.result, maxLevel: r5.maxLevel, mode: afterModeNeg.facetingParamsMode }
  console.log('[11] mode=-1: result:', r5.result, 'maxLevel:', r5.maxLevel, 'value:', afterModeNeg.facetingParamsMode)

  // String value for boolean field
  const r6 = await api.v1.common.setDatabaseSettings({ isGraphicEnabled: 'yes' })
  const afterStr = (await api.v1.common.getDatabaseSettings()).result
  results.stringBool = { result: r6.result, maxLevel: r6.maxLevel, value: afterStr.isGraphicEnabled }
  console.log('[11] string bool: result:', r6.result, 'maxLevel:', r6.maxLevel, 'value:', afterStr.isGraphicEnabled)

  // Unknown parameter name
  const r7 = await api.v1.common.setDatabaseSettings({ unknownParam: 42 })
  results.unknownParam = { result: r7.result, maxLevel: r7.maxLevel }
  console.log('[11] unknown param: result:', r7.result, 'maxLevel:', r7.maxLevel)

  // Reset to sane defaults
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.1, angleTol: 0, facetingParamsMode: 1 })

  filewrite(results, 'invalid-values')
  return {}
}
