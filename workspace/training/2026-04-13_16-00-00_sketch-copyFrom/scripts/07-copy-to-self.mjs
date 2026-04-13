// Test copyFrom when source and destination are the same sketch
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CopyToSelf' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0] })
  await api.v1.sketch.circle({ id: skId, centerPos: [20, 20, 0], radius: 8 })

  await snapshot('before-self-copy')

  // Copy sketch to itself
  const r = await api.v1.sketch.copyFrom({ id: skId, toCopyId: skId })
  console.log('[07] self-copy result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[07] self-copy messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'self-copy-response')

  await snapshot('after-self-copy')

  return { partId }
}
