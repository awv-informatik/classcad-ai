export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NonUniformScaleTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result
  const refId = (await api.v1.solid.box({ id: eifId, length: 10, width: 10, height: 10, translation: [-40, -40, 0] })).result

  const stepBefore = await api.v1.common.save({ format: 'STP' })
  filewrite(stepBefore.result.content, 'step-before')

  await snapshot('before')

  // Non-uniform scale: 3x in X, 1x in Y, 1x in Z
  const r = await api.v1.common.transformObjectWithMatrix({
    id: boxId,
    matrix: [
      [3, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })

  console.log('[11] non-uniform scale result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages && r.messages.length > 0) {
    console.log('[11] messages:', JSON.stringify(r.messages))
  }
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'nonuniform-scale-response')

  const stepAfter = await api.v1.common.save({ format: 'STP' })
  filewrite(stepAfter.result.content, 'step-after')

  await snapshot('after')

  return { partId }
}
