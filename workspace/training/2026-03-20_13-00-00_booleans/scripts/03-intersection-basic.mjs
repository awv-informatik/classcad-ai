// 03: Basic INTERSECTION — keep only overlapping region
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'BoolInt' }] })).result

  // Box 1: 100x100x60
  const sk1 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const lines1 = (await execute({ 'v1.sketch.rectangle': [{ id: sk1, startPos: [0, 0, 0], endPos: [100, 100, 0] }] })).result
  const reg1 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk1, geomIds: lines1 }] })).result
  const ext1 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [reg1], limit2: 60 }] })).result

  // Box 2: 60x60x80, offset [50, 50, 0] — partial overlap
  const sk2 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const lines2 = (await execute({ 'v1.sketch.rectangle': [{ id: sk2, startPos: [50, 50, 0], endPos: [110, 110, 0] }] })).result
  const reg2 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk2, geomIds: lines2 }] })).result
  const ext2 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [reg2], limit2: 80 }] })).result

  await snapshot('before-intersection')

  const boolId = (await execute({ 'v1.part.boolean': [{ id: partId, type: 'INTERSECTION', target: ext1, tools: [ext2] }] })).result

  await snapshot('after-intersection')

  return { partId, ext1, ext2, boolId }
}
