// 10: Non-90° angles — 60° and 120° triangles
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'Angles' }] })).result
  const skId = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result

  // Equilateral triangle (all 60° angles) — side 100
  const l1 = (await execute({ 'v1.sketch.line': [{ id: skId, startPos: [0, 0, 0], endPos: [100, 0, 0] }] })).result
  const l2 = (await execute({ 'v1.sketch.line': [{ id: skId, startPos: [100, 0, 0], endPos: [50, 86.6, 0] }] })).result
  const l3 = (await execute({ 'v1.sketch.line': [{ id: skId, startPos: [50, 86.6, 0], endPos: [0, 0, 0] }] })).result

  // Fillet with radius=10 at 60° angle
  const f1 = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [l1, l2], radius: 10 }] })
  console.log('60° fillet r=10:', JSON.stringify({ result: f1.result, messages: f1.messages }))

  // Check arc geometry
  if (f1.result) {
    const arcGeo = await execute({ 'v1.sketch.getGeometry': [{ id: f1.result[0] }] })
    console.log('Arc geometry at 60°:', JSON.stringify(arcGeo.result))
  }

  await snapshot('triangle-fillet')

  // Fillet another corner
  const f2 = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [l2, l3], radius: 10 }] })
  console.log('2nd 60° fillet:', JSON.stringify({ result: f2.result, messages: f2.messages }))

  await snapshot('triangle-2-fillets')

  return { f1: f1.result, f2: f2.result }
}
