// 05: Multiple tools — subtract 3 features at once
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'MultiTool' }] })).result

  // Base: 120x120x50
  const sk1 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l1 = (await execute({ 'v1.sketch.rectangle': [{ id: sk1, startPos: [0, 0, 0], endPos: [120, 120, 0] }] })).result
  const r1 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk1, geomIds: l1 }] })).result
  const ext1 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r1], limit2: 50 }] })).result

  // Tool 1: 20x20x80 at [10, 10]
  const sk2 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l2 = (await execute({ 'v1.sketch.rectangle': [{ id: sk2, startPos: [10, 10, 0], endPos: [30, 30, 0] }] })).result
  const r2 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk2, geomIds: l2 }] })).result
  const ext2 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r2], limit2: 80 }] })).result

  // Tool 2: 20x20x80 at [50, 50]
  const sk3 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l3 = (await execute({ 'v1.sketch.rectangle': [{ id: sk3, startPos: [50, 50, 0], endPos: [70, 70, 0] }] })).result
  const r3 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk3, geomIds: l3 }] })).result
  const ext3 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r3], limit2: 80 }] })).result

  // Tool 3: 20x20x80 at [90, 90]
  const sk4 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l4 = (await execute({ 'v1.sketch.rectangle': [{ id: sk4, startPos: [90, 90, 0], endPos: [110, 110, 0] }] })).result
  const r4 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk4, geomIds: l4 }] })).result
  const ext4 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r4], limit2: 80 }] })).result

  await snapshot('before-multi-sub')

  // Subtract all 3 at once
  const boolId = (await execute({ 'v1.part.boolean': [{ id: partId, type: 'SUBTRACTION', target: ext1, tools: [ext2, ext3, ext4] }] })).result

  await snapshot('after-multi-sub')
  return { partId, ext1, ext2, ext3, ext4, boolId }
}
