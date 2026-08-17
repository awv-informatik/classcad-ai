// Test requestVisualisation with part-level features (part.box) vs solid-level (solid.box)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VisPartFeat' })).result

  // Create a part feature (part.box)
  const boxFeatId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result
  console.log('[08] partId:', partId, 'boxFeatId:', boxFeatId)

  // Try requestVisualisation with the part feature ID
  const rFeat = await api.v1.common.requestVisualisation({ ids: [boxFeatId] })
  console.log('[08] part.box feature: result:', rFeat.result, 'maxLevel:', rFeat.maxLevel)
  console.log('[08] part.box feature: graphic?', !!rFeat.graphic, 'containers:', rFeat.graphic?.containers?.length)

  if (rFeat.graphic && rFeat.graphic.containers) {
    const c = rFeat.graphic.containers[0]
    console.log('[08] container type:', c.type, 'id:', c.id, 'owner:', c.owner)
    filewrite({
      containerCount: rFeat.graphic.containers.length,
      container0: { id: c.id, owner: c.owner, type: c.type, material: c.properties.material, min: c.properties.min, max: c.properties.max },
    }, 'part-feature-vis')
  }

  // Also try the part ID itself
  const rPart = await api.v1.common.requestVisualisation({ ids: [partId] })
  console.log('[08] partId: graphic?', !!rPart.graphic)

  // Now create an entity injection with solid.box for comparison
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const solidBoxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20, translation: [80, 0, 0] })).result
  console.log('[08] eifId:', eifId, 'solidBoxId:', solidBoxId)

  // requestVisualisation with solid ID works
  const rSolid = await api.v1.common.requestVisualisation({ ids: [solidBoxId] })
  console.log('[08] solid.box: graphic?', !!rSolid.graphic, 'containers:', rSolid.graphic?.containers?.length)

  // requestVisualisation with eifId
  const rEif = await api.v1.common.requestVisualisation({ ids: [eifId] })
  console.log('[08] eifId: graphic?', !!rEif.graphic)

  await snapshot('part-vs-solid')
  return { partId }
}
