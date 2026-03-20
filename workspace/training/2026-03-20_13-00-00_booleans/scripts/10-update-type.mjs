// 10: updateBoolean — change type from UNION to SUBTRACTION
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'UpdateBool' }] })).result

  // Box 1: 100x100x60
  const sk1 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l1 = (await execute({ 'v1.sketch.rectangle': [{ id: sk1, startPos: [0, 0, 0], endPos: [100, 100, 0] }] })).result
  const r1 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk1, geomIds: l1 }] })).result
  const ext1 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r1], limit2: 60 }] })).result

  // Box 2: 60x60x80 at [30, 40, 0]
  const sk2 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l2 = (await execute({ 'v1.sketch.rectangle': [{ id: sk2, startPos: [30, 40, 0], endPos: [90, 100, 0] }] })).result
  const r2 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk2, geomIds: l2 }] })).result
  const ext2 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r2], limit2: 80 }] })).result

  // Create as UNION first
  const boolId = (await execute({ 'v1.part.boolean': [{ id: partId, type: 'UNION', target: ext1, tools: [ext2] }] })).result
  await snapshot('union-before-update')

  // Update to SUBTRACTION
  const upRes = await execute({ 'v1.part.updateBoolean': [{ id: boolId, type: 'SUBTRACTION' }] })
  console.log('updateBoolean result:', JSON.stringify({ result: upRes.result, messages: upRes.messages, maxLevel: upRes.maxLevel }))

  await snapshot('after-update-to-sub')
  return { boolId, updateResult: upRes.result }
}
