// Test reading back per-feature faceting parameters via requestVisualisation
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VisFaceting' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const sphId = (await api.v1.solid.sphere({ id: eifId, radius: 30 })).result

  // Read default faceting
  const rDefault = await api.v1.common.requestVisualisation({ ids: [sphId] })
  const defaultFaceting = {
    chordHeightTol: rDefault.graphic.containers[0].properties.chordHeightTol,
    angleTol: rDefault.graphic.containers[0].properties.angleTol,
    vertexCount: rDefault.graphic.containers[0].meshes[0].vertices.length / 3,
  }
  console.log('[14] default faceting:', JSON.stringify(defaultFaceting))

  // Set coarse faceting
  await api.v1.common.setAppearance({ target: eifId, chordHeightTol: 5.0, angleTol: 45 })

  const rCoarse = await api.v1.common.requestVisualisation({ ids: [sphId] })
  const coarseFaceting = {
    chordHeightTol: rCoarse.graphic.containers[0].properties.chordHeightTol,
    angleTol: rCoarse.graphic.containers[0].properties.angleTol,
    vertexCount: rCoarse.graphic.containers[0].meshes[0].vertices.length / 3,
  }
  console.log('[14] coarse faceting:', JSON.stringify(coarseFaceting))

  // Set fine faceting
  await api.v1.common.setAppearance({ target: eifId, chordHeightTol: 0.01, angleTol: 1 })

  const rFine = await api.v1.common.requestVisualisation({ ids: [sphId] })
  const fineFaceting = {
    chordHeightTol: rFine.graphic.containers[0].properties.chordHeightTol,
    angleTol: rFine.graphic.containers[0].properties.angleTol,
    vertexCount: rFine.graphic.containers[0].meshes[0].vertices.length / 3,
  }
  console.log('[14] fine faceting:', JSON.stringify(fineFaceting))

  filewrite({ defaultFaceting, coarseFaceting, fineFaceting }, 'faceting-comparison')

  await snapshot('fine-sphere')
  return { partId }
}
