// Test copyFrom when source sketch is empty
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CopyFromEmpty' })).result

  // Source sketch: empty
  const srcSkId = (await api.v1.sketch.create({ id: partId })).result

  // Destination sketch: has a line
  const dstSkId = (await api.v1.sketch.create({ id: partId })).result
  await api.v1.sketch.line({ id: dstSkId, startPos: [0, 0, 0], endPos: [50, 30, 0] })

  await snapshot('dest-before')

  const r = await api.v1.sketch.copyFrom({ id: dstSkId, toCopyId: srcSkId })
  console.log('[03] copyFrom empty source result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'empty-source-response')

  await snapshot('dest-after')

  return { partId }
}
