// 19: Boolean + fillet — fillet edges after boolean subtraction
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'BoolFillet' }] })).result

  // Base: 100x100x50
  const sk1 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l1 = (await execute({ 'v1.sketch.rectangle': [{ id: sk1, startPos: [0, 0, 0], endPos: [100, 100, 0] }] })).result
  const r1 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk1, geomIds: l1 }] })).result
  const ext1 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r1], limit2: 50 }] })).result

  // Tool: 40x40x70 at [20, 50]
  const sk2 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l2 = (await execute({ 'v1.sketch.rectangle': [{ id: sk2, startPos: [20, 50, 0], endPos: [60, 90, 0] }] })).result
  const r2 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk2, geomIds: l2 }] })).result
  const ext2 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r2], limit2: 70 }] })).result

  const boolId = (await execute({ 'v1.part.boolean': [{ id: partId, type: 'SUBTRACTION', target: ext1, tools: [ext2] }] })).result
  await snapshot('after-sub-before-fillet')

  // Get brep edges after boolean to find fillet candidates
  const brep = await execute({ 'v1.part.getBrepGeometryByIndex': [{ id: partId }] })
  console.log('Brep after boolean:', JSON.stringify(brep.result))

  // Try filleting some edges — pick first few line edges
  if (brep.result && brep.result.lineIndex) {
    const edges = brep.result.lineIndex.slice(0, 4)
    const filletRes = await execute({ 'v1.part.fillet': [{ id: partId, references: edges, radius: 5 }] })
    console.log('Fillet after boolean:', JSON.stringify({ result: filletRes.result, messages: filletRes.messages, maxLevel: filletRes.maxLevel }))
    await snapshot('after-fillet')
  }

  return { boolId }
}
