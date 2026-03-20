// 15c: Tools with indices — linearPattern + boolean with indices
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'Indices' }] })).result

  // X-axis for pattern direction
  const xAxis = (await execute({ 'v1.part.workAxis': [{ id: partId, position: [0, 0, 0], direction: [1, 0, 0] }] })).result

  // Base plate: 200x60x20
  const sk1 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l1 = (await execute({ 'v1.sketch.rectangle': [{ id: sk1, startPos: [0, 0, 0], endPos: [200, 60, 0] }] })).result
  const r1 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk1, geomIds: l1 }] })).result
  const base = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r1], limit2: 20 }] })).result

  // Small peg: 20x20x40 at [10, 20]
  const sk2 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l2 = (await execute({ 'v1.sketch.rectangle': [{ id: sk2, startPos: [10, 20, 0], endPos: [30, 40, 0] }] })).result
  const r2 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk2, geomIds: l2 }] })).result
  const peg = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r2], limit2: 40 }] })).result

  // Pattern 4 pegs along X with spacing 50
  const patRes = await execute({ 'v1.part.linearPattern': [{ id: partId, targets: [peg], dir1: { references: [xAxis], count: 4, distance: 50 } }] })
  const patId = patRes.result
  console.log('Pattern:', JSON.stringify({ result: patId, messages: patRes.messages, maxLevel: patRes.maxLevel }))
  await snapshot('pattern-4-pegs')

  if (!patId) return { error: 'pattern failed' }

  // Boolean SUBTRACTION with tools indices [2] — subtract only 3rd instance
  const boolRes = await execute({ 'v1.part.boolean': [{ id: partId, type: 'SUBTRACTION', target: base, tools: [{ id: patId, indices: [2] }] }] })
  console.log('Bool indices [2]:', JSON.stringify({ result: boolRes.result, messages: boolRes.messages, maxLevel: boolRes.maxLevel }))
  await snapshot('bool-indices-2-only')

  return { patId, boolResult: boolRes.result }
}
