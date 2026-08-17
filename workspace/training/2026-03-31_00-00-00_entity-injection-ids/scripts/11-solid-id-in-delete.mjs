// Q: solid.deleteSolid takes EI id + solid ids. What IDs does it expect for the solids?
// The feature-level IDs (from solid.box result) or geometry-level IDs (from part.solids)?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'MyEI' })).result

  const box1 = (await api.v1.solid.box({ id: eifId, length: 50, width: 50, height: 50 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30, translation: [70, 0, 0] })).result
  console.log('[11] box1 (feature ID):', box1, 'box2 (feature ID):', box2)

  await snapshot('before-delete')

  // Delete box2 using the feature-level ID returned by solid.box
  const delR = await api.v1.solid.deleteSolid({ id: eifId, ids: [box2] })
  console.log('[11] deleteSolid with feature ID — result:', delR.result, 'maxLevel:', delR.maxLevel)
  if (delR.messages) {
    for (const m of delR.messages) {
      console.log('[11] msg:', m.message, 'level:', m.level)
    }
  }
  filewrite({ result: delR.result, messages: delR.messages, maxLevel: delR.maxLevel }, 'delete-result')

  await snapshot('after-delete')
  return { partId, eifId, box1, box2 }
}
