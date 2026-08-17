export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ScalingTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result
  const refId = (await api.v1.solid.box({ id: eifId, length: 10, width: 10, height: 10, translation: [-40, -40, 0] })).result

  // Save STEP before scaling
  const stepBefore = await api.v1.common.save({ format: 'STP' })
  filewrite(stepBefore.result.content, 'step-before')

  await snapshot('before')

  // Uniform 2x scale matrix
  const r = await api.v1.common.transformObjectWithMatrix({
    id: boxId,
    matrix: [
      [2, 0, 0, 0],
      [0, 2, 0, 0],
      [0, 0, 2, 0],
      [0, 0, 0, 1],
    ],
  })

  console.log('[07] scale result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages && r.messages.length > 0) {
    console.log('[07] messages:', JSON.stringify(r.messages))
  }
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'scale-response')

  // Save STEP after scaling
  const stepAfter = await api.v1.common.save({ format: 'STP' })
  filewrite(stepAfter.result.content, 'step-after')

  await snapshot('after')

  return { partId, eifId, boxId }
}
