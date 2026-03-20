// 16b: Target with indices — pattern creates multi-solid feature, pick one
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'TgtIndices' }] })).result

  // Box for patterning: 30x30x30 at origin
  const sk1 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l1 = (await execute({ 'v1.sketch.rectangle': [{ id: sk1, startPos: [0, 0, 0], endPos: [30, 30, 0] }] })).result
  const r1 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk1, geomIds: l1 }] })).result
  const box = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r1], limit2: 30 }] })).result

  // Pattern: 3 boxes along X, spacing 60 (non-merged → multi-solid)
  const patRes = await execute({ 'v1.part.linearPattern': [{ id: partId, targets: [box], dir1: { count: 3, distance: 60, merged: false } }] })
  const patId = patRes.result
  console.log('Pattern:', JSON.stringify({ result: patId, messages: patRes.messages }))
  await snapshot('pattern-3-boxes')

  // Tool: small box for subtraction
  const sk2 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l2 = (await execute({ 'v1.sketch.rectangle': [{ id: sk2, startPos: [5, 5, 0], endPos: [25, 25, 0] }] })).result
  const r2 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk2, geomIds: l2 }] })).result
  const tool = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r2], limit2: 50 }] })).result

  // Boolean with target = pattern feature, indices [0]
  const boolRes = await execute({ 'v1.part.boolean': [{ id: partId, type: 'SUBTRACTION', target: { id: patId, indices: [0] }, tools: [tool] }] })
  console.log('Bool target indices [0]:', JSON.stringify({ result: boolRes.result, messages: boolRes.messages, maxLevel: boolRes.maxLevel }))
  await snapshot('bool-target-index-0')

  return { patId, boolResult: boolRes.result }
}
