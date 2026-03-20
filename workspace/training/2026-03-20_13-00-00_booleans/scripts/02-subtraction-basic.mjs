// 02: Basic SUBTRACTION — cut a smaller box from a larger one
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'BoolSub' }] })).result

  // Base box: 100x100x60
  const sk1 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const lines1 = (await execute({ 'v1.sketch.rectangle': [{ id: sk1, startPos: [0, 0, 0], endPos: [100, 100, 0] }] })).result
  const reg1 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk1, geomIds: lines1 }] })).result
  const ext1 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [reg1], limit2: 60 }] })).result

  // Tool box: 40x40x80, positioned at [20,50,0] — asymmetric cut visible from isometric
  const sk2 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const lines2 = (await execute({ 'v1.sketch.rectangle': [{ id: sk2, startPos: [20, 50, 0], endPos: [60, 90, 0] }] })).result
  const reg2 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk2, geomIds: lines2 }] })).result
  const ext2 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [reg2], limit2: 80 }] })).result

  await snapshot('before-sub')

  const boolId = (await execute({ 'v1.part.boolean': [{ id: partId, type: 'SUBTRACTION', target: ext1, tools: [ext2] }] })).result

  await snapshot('after-sub')

  return { partId, ext1, ext2, boolId }
}
