// Error case: pass part ID instead of shape ID
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'WrongId' })).result

  const r = await api.v1.curve.bezierCurve({
    id: partId,
    points: [[0, 0, 0], [10, 10, 0], [20, 0, 0]],
  })

  console.log('[06] wrong id: result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'wrong-id-response')
  return { partId }
}
