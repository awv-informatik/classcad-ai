export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VerifyTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result

  // Set color and transparency
  const r1 = await api.v1.part.setAppearance({ target: boxId, color: [255, 0, 0], transparency: 0.3 })
  console.log('[02] setAppearance result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Try requestVisualisation — capture full response
  const vis = await api.v1.common.requestVisualisation({ ids: [boxId] })
  console.log('[02] vis result keys:', vis.result ? Object.keys(vis.result) : 'null')
  console.log('[02] vis graphic null?', vis.graphic === null)
  filewrite({ result: vis.result, messages: vis.messages, maxLevel: vis.maxLevel }, 'vis-result')
  if (vis.graphic) filewrite(vis.graphic, 'vis-graphic-full')

  await snapshot('after-color')
  return { partId, boxId }
}
