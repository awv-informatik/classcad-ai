// Edge case: offset larger than line length
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BigOffset' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })
  const lineIds = rect.result

  // Shortest line is 60, so offset=70 exceeds it
  const r = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], offset: 70 })
  console.log('[10] oversized offset result:', JSON.stringify(r.result))
  console.log('[10] maxLevel:', r.maxLevel)
  console.log('[10] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'oversized-offset-response')

  return { partId }
}
