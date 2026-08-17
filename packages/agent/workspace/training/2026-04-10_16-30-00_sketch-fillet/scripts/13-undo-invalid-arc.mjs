// Test undoFillet with invalid arcId
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UndoInvalid' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })

  // Try undoFillet with a bogus arcId
  const u = await api.v1.sketch.undoFillet({ id: skId, arcId: 99999 })
  console.log('[13] invalid undoFillet result:', JSON.stringify(u.result))
  console.log('[13] maxLevel:', u.maxLevel)
  console.log('[13] messages:', JSON.stringify(u.messages))

  filewrite({ result: u.result, messages: u.messages, maxLevel: u.maxLevel }, 'undo-invalid-response')

  return { partId }
}
