export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ShearTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result
  const refId = (await api.v1.solid.box({ id: eifId, length: 10, width: 10, height: 10, translation: [-40, -40, 0] })).result

  await snapshot('before')

  // Shear matrix (non-orthogonal): shear X by Y factor 0.5
  const r = await api.v1.common.transformObjectWithMatrix({
    id: boxId,
    matrix: [
      [1, 0.5, 0, 0],
      [0,   1, 0, 0],
      [0,   0, 1, 0],
      [0,   0, 0, 1],
    ],
  })

  console.log('[08] shear result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages && r.messages.length > 0) {
    console.log('[08] messages:', JSON.stringify(r.messages))
  }
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'shear-response')

  await snapshot('after')

  // Save STEP to verify geometry
  const step = await api.v1.common.save({ format: 'STP' })
  filewrite(step.result.content, 'step-after-shear')

  return { partId, eifId, boxId }
}
