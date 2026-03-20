// 07: Non-overlapping bodies — all 3 boolean types
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'NoOverlap' }] })).result

  // Box 1: 40x40x40 at origin
  const sk1 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l1 = (await execute({ 'v1.sketch.rectangle': [{ id: sk1, startPos: [0, 0, 0], endPos: [40, 40, 0] }] })).result
  const r1 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk1, geomIds: l1 }] })).result
  const ext1 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r1], limit2: 40 }] })).result

  // Box 2: 40x40x40 at [100, 100, 0] — no overlap
  const sk2 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l2 = (await execute({ 'v1.sketch.rectangle': [{ id: sk2, startPos: [100, 100, 0], endPos: [140, 140, 0] }] })).result
  const r2 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk2, geomIds: l2 }] })).result
  const ext2 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r2], limit2: 40 }] })).result

  // UNION of non-overlapping
  const unionRes = await execute({ 'v1.part.boolean': [{ id: partId, type: 'UNION', target: ext1, tools: [ext2] }] })
  console.log('UNION non-overlap:', JSON.stringify({ result: unionRes.result, messages: unionRes.messages, maxLevel: unionRes.maxLevel }))

  await snapshot('union-no-overlap')
  return { unionResult: unionRes.result, messages: unionRes.messages }
}
