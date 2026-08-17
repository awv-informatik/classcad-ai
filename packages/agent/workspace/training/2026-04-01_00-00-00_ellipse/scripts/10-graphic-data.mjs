// Capture graphic data for a single ellipse to verify edge counts, vertex data
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GraphicTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // Single ellipse — capture graphic data
  const r = await api.v1.curve.ellipse({ id: shapeId, centerPos: [0, 0, 0], radius1: 40, radius2: 20 })
  console.log('[10] result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite(r.graphic, 'single-ellipse-graphic')
  filewrite(r.structure, 'single-ellipse-structure')

  // Second ellipse with xAxis rotated — compare graphic
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'S2' })).result
  const r2 = await api.v1.curve.ellipse({ id: s2, centerPos: [0, 0, 0], radius1: 40, radius2: 20, xAxis: [0, 1, 0] })
  console.log('[10] rotated xAxis: result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite(r2.graphic, 'rotated-ellipse-graphic')

  await snapshot('graphic-data')
  return { partId }
}
