// Test fillet on non-connected lines — what happens?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NonConnected' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create two separate lines that don't share a point
  const l1 = await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  const l2 = await api.v1.sketch.line({ id: skId, startPos: [0, 30, 0], endPos: [50, 30, 0] })
  console.log('[12] line1:', l1.result, 'line2:', l2.result)

  const r = await api.v1.sketch.fillet({ id: skId, lineIds: [l1.result, l2.result], offset: 10 })
  console.log('[12] non-connected fillet result:', JSON.stringify(r.result))
  console.log('[12] maxLevel:', r.maxLevel)
  console.log('[12] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'non-connected-response')

  return { partId }
}
