export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ViewTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result
  console.log('[01] partId:', partId, 'boxId:', boxId)

  await snapshot('before-views')

  // Create a single view type
  const r1 = await api.v1.drawing2d.view({ id: partId, types: ['TOP'] })
  console.log('[01] single TOP view result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'single-view-response')

  await snapshot('after-top-view')

  // Create multiple view types in one call
  const r2 = await api.v1.drawing2d.view({ id: partId, types: ['FRONT', 'RIGHT', 'ISO'] })
  console.log('[01] multi view result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'multi-view-response')

  await snapshot('after-multi-views')

  // Dump structure to see what view objects look like
  filewrite(r2.structure, 'structure-after-views')

  return { partId, boxId }
}
