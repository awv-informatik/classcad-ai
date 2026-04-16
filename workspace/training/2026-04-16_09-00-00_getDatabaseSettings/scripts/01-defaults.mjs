// 01 — Get default database settings on a fresh connection (no geometry)
export default async function (api, { filewrite }) {
  const r = await api.v1.common.getDatabaseSettings()
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] result keys:', Object.keys(r.result).join(', '))
  console.log('[01] isGraphicEnabled:', r.result.isGraphicEnabled)
  console.log('[01] isCCGraphicEnabled:', r.result.isCCGraphicEnabled)
  console.log('[01] isInvisibleGraphicEnabled:', r.result.isInvisibleGraphicEnabled)
  console.log('[01] isSketchGraphicEnabled:', r.result.isSketchGraphicEnabled)
  console.log('[01] facetingParamsMode:', r.result.facetingParamsMode)
  console.log('[01] chordHeightTol:', r.result.chordHeightTol)
  console.log('[01] angleTol:', r.result.angleTol)
  console.log('[01] doCurveTessellation:', r.result.doCurveTessellation)

  filewrite(r.result, 'defaults')
  filewrite(r.messages, 'messages')

  return r.result
}
