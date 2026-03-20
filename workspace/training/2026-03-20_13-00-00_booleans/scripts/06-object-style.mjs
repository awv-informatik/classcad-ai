// 06: Object-style target and tools (with {id} syntax)
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'ObjStyle' }] })).result

  const sk1 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l1 = (await execute({ 'v1.sketch.rectangle': [{ id: sk1, startPos: [0, 0, 0], endPos: [100, 100, 0] }] })).result
  const r1 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk1, geomIds: l1 }] })).result
  const ext1 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r1], limit2: 60 }] })).result

  const sk2 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l2 = (await execute({ 'v1.sketch.rectangle': [{ id: sk2, startPos: [20, 40, 0], endPos: [80, 80, 0] }] })).result
  const r2 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk2, geomIds: l2 }] })).result
  const ext2 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r2], limit2: 80 }] })).result

  // Use object-style: target: { id: ext1 }, tools: [{ id: ext2 }]
  const boolId = (await execute({ 'v1.part.boolean': [{ id: partId, type: 'SUBTRACTION', target: { id: ext1 }, tools: [{ id: ext2 }] }] })).result

  await snapshot('obj-style-sub')
  return { partId, boolId }
}
