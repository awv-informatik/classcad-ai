// Verify cross-talk: changes via setFacetingParameters visible in getDatabaseSettings and vice versa
export default async function (api, { filewrite }) {
  // Direction 1: setFacetingParameters → getDatabaseSettings
  await api.v1.common.setFacetingParameters({ angleTol: 20, chordHeightTol: 0.05 })
  const db1 = (await api.v1.common.getDatabaseSettings()).result
  console.log('[07] set via faceting, read via db: angleTol=', db1.angleTol, 'cht=', db1.chordHeightTol)

  // Direction 2: setDatabaseSettings → getFacetingParameters
  await api.v1.common.setDatabaseSettings({ angleTol: 5, chordHeightTol: 0.8 })
  const fp2 = (await api.v1.common.getFacetingParameters()).result
  console.log('[07] set via db, read via faceting: angleTol=', fp2.angleTol, 'cht=', fp2.chordHeightTol)

  filewrite({
    direction1: { setVia: 'setFacetingParameters', readVia: 'getDatabaseSettings', angleTol: db1.angleTol, chordHeightTol: db1.chordHeightTol },
    direction2: { setVia: 'setDatabaseSettings', readVia: 'getFacetingParameters', angleTol: fp2.angleTol, chordHeightTol: fp2.chordHeightTol },
    crosstalkConfirmed: db1.angleTol === 20 && db1.chordHeightTol === 0.05 && fp2.angleTol === 5 && fp2.chordHeightTol === 0.8
  }, 'crosstalk')
  return {}
}
