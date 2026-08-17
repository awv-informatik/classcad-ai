export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BBoxTest' })).result
  await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })

  // Create views
  const viewIds = (await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT', 'RIGHT', 'ISO'] })).result
  console.log('[01] viewIds:', viewIds)

  // Get boundary boxes for all four views
  const r = await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP', 'FRONT', 'RIGHT', 'ISO'] })
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] result length:', r.result?.length)
  filewrite(r.result, 'bbox-all-four')
  filewrite({ messages: r.messages, maxLevel: r.maxLevel }, 'bbox-envelope')

  // Get boundary box for a single view
  const rTop = await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP'] })
  console.log('[01] TOP bbox:', JSON.stringify(rTop.result))

  const rFront = await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['FRONT'] })
  console.log('[01] FRONT bbox:', JSON.stringify(rFront.result))

  const rRight = await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['RIGHT'] })
  console.log('[01] RIGHT bbox:', JSON.stringify(rRight.result))

  const rIso = await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['ISO'] })
  console.log('[01] ISO bbox:', JSON.stringify(rIso.result))

  filewrite({
    top: rTop.result,
    front: rFront.result,
    right: rRight.result,
    iso: rIso.result,
  }, 'bbox-individual')

  return { partId }
}
