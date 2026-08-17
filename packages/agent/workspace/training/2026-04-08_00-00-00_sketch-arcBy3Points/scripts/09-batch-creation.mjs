// Batch creation — array of arc objects
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BatchTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const r = await api.v1.sketch.arcBy3Points([
    { id: skId, startPos: [0, 0, 0], midPos: [20, 20, 0], endPos: [40, 0, 0] },
    { id: skId, startPos: [0, -40, 0], midPos: [20, -20, 0], endPos: [40, -40, 0] },
    { id: skId, startPos: [60, 0, 0], midPos: [80, 15, 0], endPos: [100, 0, 0] },
  ])
  console.log('[09] batch result:', JSON.stringify(r.result))
  console.log('[09] batch maxLevel:', r.maxLevel)
  console.log('[09] batch messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'batch-response')

  await snapshot('batch-arcs')
  return { partId }
}
