// Delete a single solid by ID, verify it's gone
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeleteSingle' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create two boxes
  const box1 = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 50, translation: [80, 0, 0] })).result
  console.log('[01] box1:', box1, 'box2:', box2)

  await snapshot('before-delete')

  // Delete only box1
  const r = await api.v1.solid.deleteSolid({ id: eifId, ids: [box1] })
  console.log('[01] deleteSolid result:', r.result)
  console.log('[01] deleteSolid maxLevel:', r.maxLevel)
  console.log('[01] deleteSolid messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'delete-response')

  await snapshot('after-delete')

  // Dump structure to verify box1 is gone
  filewrite(r.structure, 'structure-after')
  filewrite(r.graphic, 'graphic-after')

  return { partId, eifId, box1, box2 }
}
