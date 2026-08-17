// Test basic setDatabaseSettings call and verify with getDatabaseSettings readback
export default async function (api, { filewrite }) {
  // Read defaults first
  const before = (await api.v1.common.getDatabaseSettings()).result
  console.log('[01] defaults:', JSON.stringify(before))

  // Set one field
  const r = await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.5 })
  console.log('[01] setDatabaseSettings result:', r.result, 'maxLevel:', r.maxLevel)

  // Read back
  const after = (await api.v1.common.getDatabaseSettings()).result
  console.log('[01] after set chordHeightTol=0.5:', JSON.stringify(after))
  console.log('[01] chordHeightTol changed:', before.chordHeightTol, '->', after.chordHeightTol)

  // Check other fields unchanged
  const unchanged = [
    'isGraphicEnabled', 'isCCGraphicEnabled', 'isInvisibleGraphicEnabled',
    'isSketchGraphicEnabled', 'facetingParamsMode', 'angleTol', 'doCurveTessellation'
  ]
  for (const key of unchanged) {
    const same = before[key] === after[key]
    console.log(`[01] ${key} unchanged: ${same} (${before[key]} -> ${after[key]})`)
  }

  filewrite({ before, after, setResult: r.result, setMaxLevel: r.maxLevel }, 'basic-readback')
  return { before, after }
}
