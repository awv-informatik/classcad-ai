// 99 — Restore all database settings to factory defaults
export default async function (api) {
  await api.v1.common.setDatabaseSettings({
    chordHeightTol: 0.1,
    angleTol: 0,
    facetingParamsMode: 1,
    isGraphicEnabled: true,
    isCCGraphicEnabled: true,
    isSketchGraphicEnabled: true,
    isInvisibleGraphicEnabled: false,
    doCurveTessellation: true
  })
  const db = (await api.v1.common.getDatabaseSettings()).result
  console.log('[99] Settings restored:', JSON.stringify(db))
  return db
}
