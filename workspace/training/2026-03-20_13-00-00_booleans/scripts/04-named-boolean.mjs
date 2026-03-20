// 04: Named boolean — custom name param
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'NamedBool' }] })).result

  const sk1 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const lines1 = (await execute({ 'v1.sketch.rectangle': [{ id: sk1, startPos: [0, 0, 0], endPos: [100, 100, 0] }] })).result
  const reg1 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk1, geomIds: lines1 }] })).result
  const ext1 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [reg1], limit2: 60 }] })).result

  const sk2 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const lines2 = (await execute({ 'v1.sketch.rectangle': [{ id: sk2, startPos: [30, 30, 0], endPos: [70, 70, 0] }] })).result
  const reg2 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk2, geomIds: lines2 }] })).result
  const ext2 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [reg2], limit2: 80 }] })).result

  // Named boolean
  const boolId = (await execute({ 'v1.part.boolean': [{ id: partId, type: 'UNION', target: ext1, tools: [ext2], name: 'MyCustomUnion' }] })).result

  await snapshot('named-union')
  return { partId, boolId }
}
