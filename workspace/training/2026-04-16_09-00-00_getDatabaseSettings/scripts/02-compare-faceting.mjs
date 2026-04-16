// 02 — Compare getDatabaseSettings vs getFacetingParameters — are they the same values?
export default async function (api, { filewrite }) {
  const db = (await api.v1.common.getDatabaseSettings()).result
  const fp = (await api.v1.common.getFacetingParameters()).result

  console.log('[02] DB chordHeightTol:', db.chordHeightTol, '| FP chordHeightTol:', fp.chordHeightTol)
  console.log('[02] DB angleTol:', db.angleTol, '| FP angleTol:', fp.angleTol)
  console.log('[02] Match chordHeightTol:', db.chordHeightTol === fp.chordHeightTol)
  console.log('[02] Match angleTol:', db.angleTol === fp.angleTol)
  console.log('[02] FP keys:', Object.keys(fp).join(', '))

  filewrite({ databaseSettings: db, facetingParameters: fp }, 'comparison')

  return { db, fp }
}
