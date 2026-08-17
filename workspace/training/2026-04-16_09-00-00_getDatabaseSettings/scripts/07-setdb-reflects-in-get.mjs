// 07 — Does setDatabaseSettings reflect back in getDatabaseSettings for each field?
export default async function (api, { filewrite }) {
  // Get defaults
  const defaults = (await api.v1.common.getDatabaseSettings()).result

  // Set each field individually and check it reflects
  const tests = []

  // Test boolean fields
  for (const field of ['isGraphicEnabled', 'isCCGraphicEnabled', 'isInvisibleGraphicEnabled', 'isSketchGraphicEnabled', 'doCurveTessellation']) {
    const origVal = defaults[field]
    const newVal = origVal ? false : true  // flip the boolean

    const setR = await api.v1.common.setDatabaseSettings({ [field]: newVal })
    const afterSet = (await api.v1.common.getDatabaseSettings()).result

    const testResult = {
      field,
      original: origVal,
      setValue: newVal,
      readBack: afterSet[field],
      reflected: afterSet[field] === (newVal ? 1 : 0) || afterSet[field] === newVal
    }
    console.log(`[07] ${field}: original=${origVal}, set=${newVal}, readBack=${afterSet[field]}, ok=${testResult.reflected}`)
    tests.push(testResult)

    // Restore original
    await api.v1.common.setDatabaseSettings({ [field]: origVal })
  }

  // Test numeric fields
  for (const [field, newVal] of [['chordHeightTol', 0.3], ['angleTol', 20], ['facetingParamsMode', 0]]) {
    const origVal = defaults[field]
    const setR = await api.v1.common.setDatabaseSettings({ [field]: newVal })
    const afterSet = (await api.v1.common.getDatabaseSettings()).result

    const testResult = {
      field,
      original: origVal,
      setValue: newVal,
      readBack: afterSet[field],
      reflected: afterSet[field] === newVal
    }
    console.log(`[07] ${field}: original=${origVal}, set=${newVal}, readBack=${afterSet[field]}, ok=${testResult.reflected}`)
    tests.push(testResult)

    // Restore original
    await api.v1.common.setDatabaseSettings({ [field]: origVal })
  }

  filewrite(tests, 'roundtrip-tests')

  return { allPassed: tests.every(t => t.reflected) }
}
