export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RotationTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result

  // Non-cubic box so rotation is clearly visible
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 20, height: 30 })).result
  const refId = (await api.v1.solid.box({ id: eifId, length: 10, width: 10, height: 10, translation: [-30, -30, 0] })).result

  console.log('[02] boxId:', boxId, 'refId:', refId)
  await snapshot('before')

  // 90° rotation around Z axis: cos90=0, sin90=1
  const r = await api.v1.common.transformObjectWithMatrix({
    id: boxId,
    matrix: [
      [0, -1, 0, 0],
      [1,  0, 0, 0],
      [0,  0, 1, 0],
      [0,  0, 0, 1],
    ],
  })

  console.log('[02] result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'rotation-response')

  await snapshot('after')
  return { partId, eifId, boxId }
}
