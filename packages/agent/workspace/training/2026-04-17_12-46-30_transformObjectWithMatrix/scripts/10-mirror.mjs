export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MirrorTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result

  // Mirror across YZ plane (negate X) — det = -1 (left-handed)
  const r = await api.v1.common.transformObjectWithMatrix({
    id: boxId,
    matrix: [
      [-1, 0, 0, 0],
      [ 0, 1, 0, 0],
      [ 0, 0, 1, 0],
      [ 0, 0, 0, 1],
    ],
  })

  console.log('[10] mirror result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages && r.messages.length > 0) {
    console.log('[10] messages:', JSON.stringify(r.messages))
  }
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'mirror-response')

  return { partId }
}
