// Q: What happens if you pass a shape ID to solid.box? (shape is for curves, not solids)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'MyEI' })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'MyShape' })).result
  console.log('[12] eifId:', eifId, 'shapeId:', shapeId)

  // Try using shape ID for solid creation
  const r = await api.v1.solid.box({ id: shapeId, length: 50, width: 50, height: 50 })
  console.log('[12] solid.box with shapeId — result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages) {
    for (const m of r.messages) {
      console.log('[12] msg:', m.message, 'level:', m.level, 'code:', m.code)
    }
  }
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'solid-box-with-shape-id')

  return { partId, eifId, shapeId }
}
