// 03 — Do settings persist after common.clear?
export default async function (api, { filewrite }) {
  // Get initial settings
  const before = (await api.v1.common.getDatabaseSettings()).result

  // Change a setting
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.5, angleTol: 15 })
  const afterSet = (await api.v1.common.getDatabaseSettings()).result
  console.log('[03] After set: chordHeightTol:', afterSet.chordHeightTol, 'angleTol:', afterSet.angleTol)

  // Clear the drawing
  await api.v1.common.clear({})

  // Check if settings survived the clear
  const afterClear = (await api.v1.common.getDatabaseSettings()).result
  console.log('[03] After clear: chordHeightTol:', afterClear.chordHeightTol, 'angleTol:', afterClear.angleTol)
  console.log('[03] Settings survived clear:', afterClear.chordHeightTol === afterSet.chordHeightTol && afterClear.angleTol === afterSet.angleTol)

  filewrite({ before, afterSet, afterClear }, 'persist-clear')

  return { before, afterSet, afterClear }
}
