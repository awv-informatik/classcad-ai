export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IdentityTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result

  // Save STEP before
  const stepBefore = await api.v1.common.save({ format: 'STP' })
  filewrite(stepBefore.result.content, 'identity-step-before')

  // Apply identity matrix — should be a no-op
  const r = await api.v1.common.transformObjectWithMatrix({
    id: boxId,
    matrix: [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })

  console.log('[05] identity result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'identity-response')

  // Save STEP after
  const stepAfter = await api.v1.common.save({ format: 'STP' })
  filewrite(stepAfter.result.content, 'identity-step-after')

  return { partId, eifId, boxId }
}
