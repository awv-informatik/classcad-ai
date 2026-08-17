// Compare graphic data before, during, and after openFeature
// to see if body visibility changes at the rendering level.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GraphicTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', radius: 15, height: 60 })).result
  const sphId = (await api.v1.part.sphere({ id: partId, name: 'Sph1', radius: 20, position: [40, 0, 0] })).result

  // Get graphic data BEFORE openFeature
  const beforeR = await api.v1.common.requestVisualisation({})
  const beforeGraphic = beforeR.graphic
  console.log('[03] BEFORE — graphic meshes:', beforeGraphic?.meshes?.length || 0)
  if (beforeGraphic?.meshes) {
    beforeGraphic.meshes.forEach((m, i) => console.log(`  mesh[${i}]: verts=${m.vertices?.length || 0} indices=${m.indices?.length || 0}`))
  }
  filewrite({ meshCount: beforeGraphic?.meshes?.length, meshSummary: summarizeMeshes(beforeGraphic) }, 'graphic-before')

  // Open middle feature (Cyl1)
  await api.v1.part.openFeature({ id: cylId })

  // Get graphic data DURING openFeature
  const duringR = await api.v1.common.requestVisualisation({})
  const duringGraphic = duringR.graphic
  console.log('[03] DURING — graphic meshes:', duringGraphic?.meshes?.length || 0)
  if (duringGraphic?.meshes) {
    duringGraphic.meshes.forEach((m, i) => console.log(`  mesh[${i}]: verts=${m.vertices?.length || 0} indices=${m.indices?.length || 0}`))
  }
  filewrite({ meshCount: duringGraphic?.meshes?.length, meshSummary: summarizeMeshes(duringGraphic) }, 'graphic-during')

  // Close
  await api.v1.part.closeFeature({ id: cylId })

  // Get graphic data AFTER closeFeature
  const afterR = await api.v1.common.requestVisualisation({})
  const afterGraphic = afterR.graphic
  console.log('[03] AFTER — graphic meshes:', afterGraphic?.meshes?.length || 0)
  if (afterGraphic?.meshes) {
    afterGraphic.meshes.forEach((m, i) => console.log(`  mesh[${i}]: verts=${m.vertices?.length || 0} indices=${m.indices?.length || 0}`))
  }
  filewrite({ meshCount: afterGraphic?.meshes?.length, meshSummary: summarizeMeshes(afterGraphic) }, 'graphic-after')

  return { partId }
}

function summarizeMeshes(graphic) {
  if (!graphic?.meshes) return []
  return graphic.meshes.map((m, i) => ({
    index: i,
    vertCount: m.vertices?.length || 0,
    indexCount: m.indices?.length || 0,
    color: m.color,
    id: m.id,
  }))
}
