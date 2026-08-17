// 13 — Rotate an empty shape (no curves)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EmptyTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Empty' })).result

  const r = await api.v1.curve.rotateShape({ id: shapeId, rotation: [0, 0, Math.PI / 2] })
  console.log('[13] empty shape rotation — result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[13] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'empty-response')

  return { partId }
}
