// Basic ellipse creation with required params only
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EllipseTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Ellipses' })).result

  // Basic ellipse with radius1 > radius2
  const r1 = await api.v1.curve.ellipse({ id: shapeId, centerPos: [0, 0, 0], radius1: 30, radius2: 15 })
  console.log('[01] ellipse r1>r2: result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'ellipse-r1-gt-r2')

  await snapshot('basic-ellipse')
  return { partId, eifId, shapeId }
}
