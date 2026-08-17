// 08 — Does setFacetingParameters affect getDatabaseSettings and vice versa?
export default async function (api, { filewrite }) {
  // Initial state
  const dbBefore = (await api.v1.common.getDatabaseSettings()).result
  const fpBefore = (await api.v1.common.getFacetingParameters()).result
  console.log('[08] Initial DB chord:', dbBefore.chordHeightTol, 'angle:', dbBefore.angleTol)
  console.log('[08] Initial FP chord:', fpBefore.chordHeightTol, 'angle:', fpBefore.angleTol)

  // Change via setFacetingParameters — does getDatabaseSettings reflect it?
  await api.v1.common.setFacetingParameters({ chordHeightTol: 0.7, angleTol: 25 })
  const dbAfterFP = (await api.v1.common.getDatabaseSettings()).result
  const fpAfterFP = (await api.v1.common.getFacetingParameters()).result
  console.log('[08] After setFP -> DB chord:', dbAfterFP.chordHeightTol, 'angle:', dbAfterFP.angleTol)
  console.log('[08] After setFP -> FP chord:', fpAfterFP.chordHeightTol, 'angle:', fpAfterFP.angleTol)

  // Reset
  await api.v1.common.setFacetingParameters({ chordHeightTol: 0.1, angleTol: 0 })

  // Change via setDatabaseSettings — does getFacetingParameters reflect it?
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.9, angleTol: 30 })
  const dbAfterDB = (await api.v1.common.getDatabaseSettings()).result
  const fpAfterDB = (await api.v1.common.getFacetingParameters()).result
  console.log('[08] After setDB -> DB chord:', dbAfterDB.chordHeightTol, 'angle:', dbAfterDB.angleTol)
  console.log('[08] After setDB -> FP chord:', fpAfterDB.chordHeightTol, 'angle:', fpAfterDB.angleTol)

  // Restore defaults
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.1, angleTol: 0 })

  filewrite({
    initial: { db: dbBefore, fp: fpBefore },
    afterSetFP: { db: dbAfterFP, fp: fpAfterFP },
    afterSetDB: { db: dbAfterDB, fp: fpAfterDB }
  }, 'cross-api')

  return { dbAfterFP, fpAfterFP, dbAfterDB, fpAfterDB }
}
