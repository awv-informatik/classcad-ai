// 16: Negative offset exploration — what geometry does it produce?
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'NegOffset' }] })).result
  const skId = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result

  const lines = (await execute({ 'v1.sketch.rectangle': [{ id: skId, startPos: [0, 0, 0], endPos: [100, 80, 0] }] })).result

  // Negative offset
  const f = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [lines[0], lines[1]], offset: -10 }] })
  console.log('Negative offset:', JSON.stringify({ result: f.result, messages: f.messages }))

  if (f.result) {
    // Inspect arc geometry
    const arcGeo = await execute({ 'v1.sketch.getGeometry': [{ id: f.result[0] }] })
    console.log('Arc geometry (negative offset):', JSON.stringify(arcGeo.result))
    // Inspect start/end points
    const startPt = await execute({ 'v1.sketch.getGeometry': [{ id: f.result[2] }] })
    const endPt = await execute({ 'v1.sketch.getGeometry': [{ id: f.result[3] }] })
    console.log('Start point:', JSON.stringify(startPt.result))
    console.log('End point:', JSON.stringify(endPt.result))
  }

  await snapshot('negative-offset')

  return { result: f.result }
}
