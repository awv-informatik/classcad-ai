// Test facetingParamsMode 0 vs 1 — effect on r.graphic mesh data
export default async function (api, { filewrite }) {
  // Create some geometry to test graphic data presence
  const partId = (await api.v1.part.create({ name: 'FPMTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Mode 1 (default) — expect no mesh data
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 1 })
  const boxR1 = await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })
  const hasGraphic1 = boxR1.graphic && boxR1.graphic.containers && boxR1.graphic.containers.length > 0
  const hasMesh1 = hasGraphic1 && boxR1.graphic.containers[0].meshes && boxR1.graphic.containers[0].meshes.length > 0
  console.log('[03] mode=1: hasGraphic:', hasGraphic1, 'hasMesh:', hasMesh1)

  // Delete and recreate with mode 0
  await api.v1.solid.deleteSolid({ id: eifId, target: boxR1.result })

  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0 })
  const verify = (await api.v1.common.getDatabaseSettings()).result
  console.log('[03] verify mode set to:', verify.facetingParamsMode)

  const boxR2 = await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })
  const hasGraphic2 = boxR2.graphic && boxR2.graphic.containers && boxR2.graphic.containers.length > 0
  const hasMesh2 = hasGraphic2 && boxR2.graphic.containers[0].meshes && boxR2.graphic.containers[0].meshes.length > 0
  console.log('[03] mode=0: hasGraphic:', hasGraphic2, 'hasMesh:', hasMesh2)

  if (hasMesh2) {
    const mesh = boxR2.graphic.containers[0].meshes[0]
    console.log('[03] mesh vertex count:', mesh.vertices ? mesh.vertices.length / 3 : 'N/A')
  }

  filewrite({
    mode1: { hasGraphic: hasGraphic1, hasMesh: hasMesh1 },
    mode0: { hasGraphic: hasGraphic2, hasMesh: hasMesh2 },
  }, 'faceting-mode')

  return { partId }
}
