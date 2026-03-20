// 17: Intersection with 3+ tools
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'Int3Way' }] })).result

  // Box 1: 100x100x60 at origin
  const sk1 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l1 = (await execute({ 'v1.sketch.rectangle': [{ id: sk1, startPos: [0, 0, 0], endPos: [100, 100, 0] }] })).result
  const r1 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk1, geomIds: l1 }] })).result
  const ext1 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r1], limit2: 60 }] })).result

  // Box 2: 80x80x50 at [20, 20]
  const sk2 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l2 = (await execute({ 'v1.sketch.rectangle': [{ id: sk2, startPos: [20, 20, 0], endPos: [100, 100, 0] }] })).result
  const r2 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk2, geomIds: l2 }] })).result
  const ext2 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r2], limit2: 50 }] })).result

  // Box 3: 60x60x80 at [30, 30]
  const sk3 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l3 = (await execute({ 'v1.sketch.rectangle': [{ id: sk3, startPos: [30, 30, 0], endPos: [90, 90, 0] }] })).result
  const r3 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk3, geomIds: l3 }] })).result
  const ext3 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r3], limit2: 80 }] })).result

  // INTERSECTION: ext1 ∩ ext2 ∩ ext3
  const res = await execute({ 'v1.part.boolean': [{ id: partId, type: 'INTERSECTION', target: ext1, tools: [ext2, ext3] }] })
  console.log('3-way intersection:', JSON.stringify({ result: res.result, messages: res.messages, maxLevel: res.maxLevel }))
  await snapshot('3-way-intersection')

  return { result: res.result }
}
