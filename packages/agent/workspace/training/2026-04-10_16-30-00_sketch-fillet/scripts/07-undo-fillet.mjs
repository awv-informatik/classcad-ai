// Test undoFillet — remove a fillet and verify lines reconnect
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UndoFillet' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })
  const lineIds = rect.result

  // Create fillet
  const r = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], offset: 12 })
  const [arcId] = r.result
  console.log('[07] fillet arcId:', arcId)
  await snapshot('before-undo')

  // Undo fillet
  const u = await api.v1.sketch.undoFillet({ id: skId, arcId })
  console.log('[07] undoFillet result:', JSON.stringify(u.result))
  console.log('[07] undoFillet maxLevel:', u.maxLevel)
  console.log('[07] undoFillet messages:', JSON.stringify(u.messages))

  filewrite({ result: u.result, messages: u.messages, maxLevel: u.maxLevel }, 'undo-response')
  await snapshot('after-undo')

  return { partId }
}
