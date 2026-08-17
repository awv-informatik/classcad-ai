// Test: single sphere at cht=0.5 — no loop, just one geometry
export default async function (api, { filewrite }) {
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0, chordHeightTol: 0.5, angleTol: 0 })
  const settings = (await api.v1.common.getDatabaseSettings()).result
  console.log('[21] settings:', JSON.stringify({ mode: settings.facetingParamsMode, cht: settings.chordHeightTol, at: settings.angleTol }))

  const partId = (await api.v1.part.create({ name: 'Single' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const sphereR = await api.v1.solid.sphere({ id: eifId, radius: 20 })

  const hasGraphic = !!sphereR.graphic
  const containers = sphereR.graphic?.containers || []
  let vertCount = 0
  let idxCount = 0
  for (const c of containers) {
    for (const m of c.meshes || []) {
      vertCount += (m.vertices?.length || 0) / 3
      idxCount += m.indices?.length || 0
    }
  }

  console.log('[21] hasGraphic:', hasGraphic, 'containers:', containers.length, 'vertices:', vertCount, 'indices:', idxCount)

  // Also check if graphic has the container but meshes are empty
  if (containers.length > 0) {
    console.log('[21] container[0] keys:', Object.keys(containers[0]).join(', '))
    console.log('[21] container[0].meshes length:', containers[0].meshes?.length || 0)
    if (containers[0].meshes?.length > 0) {
      console.log('[21] mesh[0] keys:', Object.keys(containers[0].meshes[0]).join(', '))
      console.log('[21] mesh[0].vertices length:', containers[0].meshes[0].vertices?.length || 0)
    }
  }

  filewrite({ hasGraphic, containerCount: containers.length, vertCount, idxCount }, 'single-mesh')
  return { vertCount }
}
