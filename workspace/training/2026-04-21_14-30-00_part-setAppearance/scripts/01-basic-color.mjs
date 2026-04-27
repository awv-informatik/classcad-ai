export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'AppTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result

  console.log('[01] partId:', partId, 'boxId:', boxId)

  // Set color red + transparency on the box feature
  const r = await api.v1.part.setAppearance({ target: boxId, color: [255, 0, 0], transparency: 0.3 })
  console.log('[01] setAppearance result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'set-result')

  // Verify via requestVisualisation
  const vis = await api.v1.common.requestVisualisation({ ids: [boxId] })
  filewrite(vis.graphic, 'vis-graphic')

  await snapshot('after-color')
  return { partId, boxId }
}
