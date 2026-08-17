export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CenterViewTest' })).result
  await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })

  // Create views
  const viewIds = (await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT', 'ISO'] })).result
  console.log('[01] viewIds:', viewIds)

  // Get bbox before centering
  const bboxBefore = await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP', 'FRONT', 'ISO'] })
  console.log('[01] bbox before center maxLevel:', bboxBefore.maxLevel)
  filewrite(bboxBefore.result, 'bbox-before')

  // Center all views
  const r = await api.v1.drawing2d.centerView({ id: partId, types: ['TOP', 'FRONT', 'ISO'] })
  console.log('[01] centerView result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'centerView-response')

  // Get bbox after centering
  const bboxAfter = await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP', 'FRONT', 'ISO'] })
  console.log('[01] bbox after center maxLevel:', bboxAfter.maxLevel)
  filewrite(bboxAfter.result, 'bbox-after')

  await snapshot('after-center')
  return { partId, viewIds }
}
