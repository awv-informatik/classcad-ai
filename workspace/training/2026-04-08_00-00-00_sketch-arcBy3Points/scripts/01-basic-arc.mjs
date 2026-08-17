// Basic arc by 3 points in a sketch — happy path
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const r = await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [0, 0, 0],
    midPos: [20, 20, 0],
    endPos: [40, 0, 0],
  })

  console.log('[01] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'response')

  await snapshot('basic-arc')
  return { partId }
}
