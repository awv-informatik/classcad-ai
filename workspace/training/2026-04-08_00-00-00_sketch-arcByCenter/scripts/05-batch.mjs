// 05 — Batch creation: pass array of arc params
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BatchTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const r = await api.v1.sketch.arcByCenter([
    { id: skId, startPos: [-30, 0, 0], centerPos: [0, 0, 0], endPos: [30, 0, 0] },
    { id: skId, startPos: [-20, -60, 0], centerPos: [0, -60, 0], endPos: [20, -60, 0], isClockwise: false },
    { id: skId, startPos: [50, 30, 0], centerPos: [50, 50, 0], endPos: [50, 70, 0] },
  ])

  console.log('[05] batch result:', JSON.stringify(r.result))
  console.log('[05] batch maxLevel:', r.maxLevel)
  console.log('[05] result is array:', Array.isArray(r.result))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-response')

  await snapshot('batch')
  return { partId }
}
