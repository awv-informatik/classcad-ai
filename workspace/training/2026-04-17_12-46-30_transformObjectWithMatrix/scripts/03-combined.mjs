export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CombinedTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 20, height: 30 })).result
  const refId = (await api.v1.solid.box({ id: eifId, length: 10, width: 10, height: 10, translation: [-30, -30, 0] })).result

  await snapshot('before')

  // 45° rotation around Z + translation [50, 50, 0]
  const c = Math.cos(Math.PI / 4)
  const s = Math.sin(Math.PI / 4)
  const r = await api.v1.common.transformObjectWithMatrix({
    id: boxId,
    matrix: [
      [c, -s, 0, 50],
      [s,  c, 0, 50],
      [0,  0, 1,  0],
      [0,  0, 0,  1],
    ],
  })

  console.log('[03] result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'combined-response')

  await snapshot('after')
  return { partId, eifId, boxId }
}
