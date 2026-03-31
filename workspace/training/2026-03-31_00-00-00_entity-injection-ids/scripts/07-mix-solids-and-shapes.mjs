// Q: Can you mix solids and shapes in the same entity injection?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'MixedEI' })).result

  // Create a solid
  const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 50, height: 50 })).result
  console.log('[07] boxId:', boxId)

  // Create a shape with a curve
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Outline' })).result
  const lineR = await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 60], endPos: [80, 0, 60] })
  console.log('[07] shapeId:', shapeId, 'line result:', lineR.result, 'maxLevel:', lineR.maxLevel)

  await snapshot('mixed-solid-and-shape')
  filewrite({ eifId, boxId, shapeId }, 'mixed-ids')

  return { partId, eifId, boxId, shapeId }
}
