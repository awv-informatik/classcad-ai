// 16c: Target with indices — pattern as boolean target, pick one instance
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'TgtIdx' }] })).result

  const xAxis = (await execute({ 'v1.part.workAxis': [{ id: partId, position: [0, 0, 0], direction: [1, 0, 0] }] })).result

  // Box: 30x30x30 at origin
  const sk1 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l1 = (await execute({ 'v1.sketch.rectangle': [{ id: sk1, startPos: [0, 0, 0], endPos: [30, 30, 0] }] })).result
  const r1 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk1, geomIds: l1 }] })).result
  const box = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r1], limit2: 30 }] })).result

  // Pattern: 3 boxes along X, spacing 60
  const patRes = await execute({ 'v1.part.linearPattern': [{ id: partId, targets: [box], dir1: { references: [xAxis], count: 3, distance: 60, merged: false } }] })
  const patId = patRes.result
  console.log('Pattern:', JSON.stringify({ result: patId, messages: patRes.messages }))
  await snapshot('pattern-3-boxes')

  if (!patId) return { error: 'pattern failed' }

  // Tool for subtraction: 20x20x50 at [5, 5]
  const sk2 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l2 = (await execute({ 'v1.sketch.rectangle': [{ id: sk2, startPos: [5, 5, 0], endPos: [25, 25, 0] }] })).result
  const r2 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk2, geomIds: l2 }] })).result
  const tool = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r2], limit2: 50 }] })).result

  // Boolean: target = pattern[0] only
  const boolRes = await execute({ 'v1.part.boolean': [{ id: partId, type: 'SUBTRACTION', target: { id: patId, indices: [0] }, tools: [tool] }] })
  console.log('Bool target[0]:', JSON.stringify({ result: boolRes.result, messages: boolRes.messages, maxLevel: boolRes.maxLevel }))
  await snapshot('bool-target-idx-0')

  return { patId, boolResult: boolRes.result }
}
