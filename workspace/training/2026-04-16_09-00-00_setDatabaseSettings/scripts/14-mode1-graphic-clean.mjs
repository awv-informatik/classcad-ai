// Clean test: does mode=1 truly suppress mesh data?
// Script 03 showed mode=1 still had meshes. Test with a fresh reset.
export default async function (api, { filewrite }) {
  // Hard reset to defaults
  await api.v1.common.setDatabaseSettings({
    facetingParamsMode: 1,
    chordHeightTol: 0.1,
    angleTol: 0,
    isGraphicEnabled: 1,
    isCCGraphicEnabled: 1,
    isInvisibleGraphicEnabled: 0,
    isSketchGraphicEnabled: 1,
    doCurveTessellation: 1,
  })
  const settings = (await api.v1.common.getDatabaseSettings()).result
  console.log('[14] reset settings:', JSON.stringify(settings))

  // Create geometry with mode=1
  const partId = (await api.v1.part.create({ name: 'Mode1Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const cylR = await api.v1.solid.cylinder({ id: eifId, height: 30, diameter: 20 })
  const g1 = cylR.graphic
  const containers1 = g1?.containers || []
  const mesh1Count = containers1.length > 0 ? (containers1[0].meshes?.length || 0) : 0
  const edge1Count = containers1.length > 0 ? (containers1[0].edges?.length || 0) : 0
  console.log('[14] mode=1: containers:', containers1.length, 'meshes:', mesh1Count, 'edges:', edge1Count)
  if (mesh1Count > 0) {
    const m = containers1[0].meshes[0]
    console.log('[14] mode=1: mesh has', m.vertices?.length / 3, 'vertices,', m.indices?.length, 'indices')
  }

  // Now switch to mode=0 and create another cylinder
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0 })
  const cyl2R = await api.v1.solid.cylinder({ id: eifId, height: 30, diameter: 20, translation: [40, 0, 0] })
  const g2 = cyl2R.graphic
  const containers2 = g2?.containers || []
  const mesh2Count = containers2.length > 0 ? (containers2[0].meshes?.length || 0) : 0
  const edge2Count = containers2.length > 0 ? (containers2[0].edges?.length || 0) : 0
  console.log('[14] mode=0: containers:', containers2.length, 'meshes:', mesh2Count, 'edges:', edge2Count)
  if (mesh2Count > 0) {
    const m = containers2[0].meshes[0]
    console.log('[14] mode=0: mesh has', m.vertices?.length / 3, 'vertices,', m.indices?.length, 'indices')
  }

  filewrite({
    mode1: { containers: containers1.length, meshes: mesh1Count, edges: edge1Count,
             containerKeys: containers1.length > 0 ? Object.keys(containers1[0]) : [] },
    mode0: { containers: containers2.length, meshes: mesh2Count, edges: edge2Count,
             containerKeys: containers2.length > 0 ? Object.keys(containers2[0]) : [] },
  }, 'mode1-graphic')

  return { partId }
}
