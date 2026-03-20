// 20b: Pattern a boolean feature (with workAxis for direction)
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'PatternBool' }] })).result

  const xAxis = (await execute({ 'v1.part.workAxis': [{ id: partId, position: [0, 0, 0], direction: [1, 0, 0] }] })).result

  // Base plate: 200x60x20
  const sk1 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l1 = (await execute({ 'v1.sketch.rectangle': [{ id: sk1, startPos: [0, 0, 0], endPos: [200, 60, 0] }] })).result
  const r1 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk1, geomIds: l1 }] })).result
  const base = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r1], limit2: 20 }] })).result

  // Small box for hole: 15x15x40 at [10, 22]
  const sk2 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l2 = (await execute({ 'v1.sketch.rectangle': [{ id: sk2, startPos: [10, 22, 0], endPos: [25, 38, 0] }] })).result
  const r2 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk2, geomIds: l2 }] })).result
  const hole = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r2], limit2: 40 }] })).result

  // Boolean subtraction
  const boolId = (await execute({ 'v1.part.boolean': [{ id: partId, type: 'SUBTRACTION', target: base, tools: [hole] }] })).result
  await snapshot('after-single-hole')

  // Pattern the boolean feature along X
  const patRes = await execute({ 'v1.part.linearPattern': [{ id: partId, targets: [boolId], dir1: { references: [xAxis], count: 5, distance: 40 } }] })
  console.log('Pattern boolean:', JSON.stringify({ result: patRes.result, messages: patRes.messages, maxLevel: patRes.maxLevel }))
  await snapshot('after-pattern-holes')

  return { boolId, patternId: patRes.result }
}
