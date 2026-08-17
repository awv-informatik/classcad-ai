// 02 — batch line creation, verify array return
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BatchPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create 3 lines in batch
  const r = await api.v1.sketch.line([
    { id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] },
    { id: skId, startPos: [50, 0, 0], endPos: [50, 40, 0] },
    { id: skId, startPos: [50, 40, 0], endPos: [0, 0, 0] },
  ])
  console.log('[02] batch result:', JSON.stringify(r.result))
  console.log('[02] maxLevel:', r.maxLevel)
  console.log('[02] messages:', JSON.stringify(r.messages))

  // Check that result is an array of 3 IDs
  const ids = r.result
  console.log('[02] isArray:', Array.isArray(ids), 'length:', ids?.length)

  // Get points of each line to see if coincident endpoints share IDs
  for (const lineId of ids) {
    const pts = await api.v1.sketch.getPoints({ id: lineId })
    console.log('[02] line', lineId, '→ start:', pts.result.startId, 'end:', pts.result.endId)
  }

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-response')

  await snapshot('batch-triangle')
  return { partId, skId, ids }
}
