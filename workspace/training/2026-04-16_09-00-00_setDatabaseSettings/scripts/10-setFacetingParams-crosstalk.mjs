// Test cross-talk: setDatabaseSettings chord/angle vs setFacetingParameters chord/angle
export default async function (api, { filewrite }) {
  // Reset to defaults first
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.1, angleTol: 0 })

  // Set via setDatabaseSettings
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.5, angleTol: 25 })
  const dbAfterSet = (await api.v1.common.getDatabaseSettings()).result
  const fpAfterSet = (await api.v1.common.getFacetingParameters({})).result
  console.log('[10] after setDatabaseSettings(chord=0.5, angle=25):')
  console.log('[10]   getDatabaseSettings:', dbAfterSet.chordHeightTol, dbAfterSet.angleTol)
  console.log('[10]   getFacetingParameters:', fpAfterSet.chordHeightTol, fpAfterSet.angleTol)

  // Now set via setFacetingParameters
  await api.v1.common.setFacetingParameters({ chordHeightTol: 0.8, angleTol: 40 })
  const dbAfterFP = (await api.v1.common.getDatabaseSettings()).result
  const fpAfterFP = (await api.v1.common.getFacetingParameters({})).result
  console.log('[10] after setFacetingParameters(chord=0.8, angle=40):')
  console.log('[10]   getDatabaseSettings:', dbAfterFP.chordHeightTol, dbAfterFP.angleTol)
  console.log('[10]   getFacetingParameters:', fpAfterFP.chordHeightTol, fpAfterFP.angleTol)

  // Check: do they share the same backing store?
  console.log('[10] shared store:', dbAfterFP.chordHeightTol === fpAfterFP.chordHeightTol && dbAfterFP.angleTol === fpAfterFP.angleTol)

  filewrite({ dbAfterSet, fpAfterSet, dbAfterFP, fpAfterFP }, 'crosstalk')
  return {}
}
