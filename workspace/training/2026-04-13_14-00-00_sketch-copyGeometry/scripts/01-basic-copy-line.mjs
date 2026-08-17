// Test basic copyGeometry — copy a single line with translation
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CopyGeoTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a line
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  console.log('[01] lineId:', lineId)

  await snapshot('before-copy')

  // Copy the line with a Y offset
  const r = await api.v1.sketch.copyGeometry({
    id: skId,
    geomIds: [lineId],
    translation: [0, 30, 0]
  })
  console.log('[01] copyGeometry result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'copy-response')

  await snapshot('after-copy')

  return { partId, lineId, copiedIds: r.result }
}
