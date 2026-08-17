// Test all boolean fields — JS true/false vs 0/1
export default async function (api, { filewrite }) {
  // Set all booleans using JS true/false
  const r1 = await api.v1.common.setDatabaseSettings({
    isGraphicEnabled: false,
    isCCGraphicEnabled: false,
    isInvisibleGraphicEnabled: true,
    isSketchGraphicEnabled: false,
    doCurveTessellation: false,
  })
  console.log('[02] set with JS booleans - maxLevel:', r1.maxLevel)
  const after1 = (await api.v1.common.getDatabaseSettings()).result
  console.log('[02] after JS booleans:', JSON.stringify(after1))

  // Set all booleans using 0/1 integers
  const r2 = await api.v1.common.setDatabaseSettings({
    isGraphicEnabled: 1,
    isCCGraphicEnabled: 1,
    isInvisibleGraphicEnabled: 0,
    isSketchGraphicEnabled: 1,
    doCurveTessellation: 1,
  })
  console.log('[02] set with 0/1 integers - maxLevel:', r2.maxLevel)
  const after2 = (await api.v1.common.getDatabaseSettings()).result
  console.log('[02] after 0/1 integers:', JSON.stringify(after2))

  // Check: does readback always return 0/1?
  console.log('[02] isGraphicEnabled type after JS false:', typeof after1.isGraphicEnabled, 'value:', after1.isGraphicEnabled)
  console.log('[02] isGraphicEnabled type after int 1:', typeof after2.isGraphicEnabled, 'value:', after2.isGraphicEnabled)

  filewrite({ afterJsBooleans: after1, afterIntBooleans: after2 }, 'boolean-fields')
  return { after1, after2 }
}
