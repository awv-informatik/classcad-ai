// Edge case: radius=0
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ZeroRadius' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })
  const lineIds = rect.result

  const r = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], radius: 0 })
  console.log('[11] zero radius result:', JSON.stringify(r.result))
  console.log('[11] maxLevel:', r.maxLevel)
  console.log('[11] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'zero-radius-response')

  return { partId }
}
