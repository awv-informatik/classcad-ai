// Test: cross-talk between setFacetingParameters and getDatabaseSettings (and vice versa)
export default async function (api, { filewrite }) {
  // Reset to defaults
  await api.v1.common.setFacetingParameters({ angleTol: 0, chordHeightTol: 0.1 })

  // Set via setFacetingParameters, read via getDatabaseSettings
  await api.v1.common.setFacetingParameters({ angleTol: 20, chordHeightTol: 0.05 })
  const dbAfterFaceting = (await api.v1.common.getDatabaseSettings()).result
  console.log('[08] after setFacetingParameters — db angleTol:', dbAfterFaceting.angleTol)
  console.log('[08] after setFacetingParameters — db chordHeightTol:', dbAfterFaceting.chordHeightTol)

  // Set via setDatabaseSettings, read via getFacetingParameters
  await api.v1.common.setDatabaseSettings({ angleTol: 5, chordHeightTol: 0.8 })
  const facetAfterDb = (await api.v1.common.getFacetingParameters()).result
  console.log('[08] after setDatabaseSettings — faceting angleTol:', facetAfterDb.angleTol)
  console.log('[08] after setDatabaseSettings — faceting chordHeightTol:', facetAfterDb.chordHeightTol)

  filewrite({
    setViaFaceting: { angleTol: 20, chordHeightTol: 0.05 },
    readViaDb: { angleTol: dbAfterFaceting.angleTol, chordHeightTol: dbAfterFaceting.chordHeightTol },
    setViaDb: { angleTol: 5, chordHeightTol: 0.8 },
    readViaFaceting: facetAfterDb,
  }, 'crosstalk')
  return { dbAfterFaceting, facetAfterDb }
}
