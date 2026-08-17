// 05 — Zero rotation vector — should be a noop
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ZeroTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Test' })).result

  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [20, 10, 0] })

  const r = await api.v1.curve.rotateShape({ id: shapeId, rotation: [0, 0, 0] })
  console.log('[05] zero rotation result:', r.result)
  console.log('[05] maxLevel:', r.maxLevel)
  console.log('[05] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'zero-response')

  await snapshot('zero-rotation')

  return { partId }
}
