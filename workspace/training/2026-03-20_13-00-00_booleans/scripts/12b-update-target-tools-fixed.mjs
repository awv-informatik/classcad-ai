// 12b: updateBoolean — change target and tools (with openFeature/closeFeature)
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'UpdateTgtTool' }] })).result

  // 3 boxes
  const sk1 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l1 = (await execute({ 'v1.sketch.rectangle': [{ id: sk1, startPos: [0, 0, 0], endPos: [80, 80, 0] }] })).result
  const r1 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk1, geomIds: l1 }] })).result
  const ext1 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r1], limit2: 50 }] })).result

  const sk2 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l2 = (await execute({ 'v1.sketch.rectangle': [{ id: sk2, startPos: [20, 20, 0], endPos: [60, 60, 0] }] })).result
  const r2 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk2, geomIds: l2 }] })).result
  const ext2 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r2], limit2: 70 }] })).result

  const sk3 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l3 = (await execute({ 'v1.sketch.rectangle': [{ id: sk3, startPos: [40, 40, 0], endPos: [100, 100, 0] }] })).result
  const r3 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk3, geomIds: l3 }] })).result
  const ext3 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r3], limit2: 60 }] })).result

  // Boolean: ext1 - ext2
  const boolId = (await execute({ 'v1.part.boolean': [{ id: partId, type: 'SUBTRACTION', target: ext1, tools: [ext2] }] })).result
  await snapshot('original-sub')

  // Open, change target to ext3 and tools to [ext1]
  await execute({ 'v1.part.openFeature': [{ id: boolId }] })
  const res = await execute({ 'v1.part.updateBoolean': [{ id: boolId, target: { id: ext3 }, tools: [{ id: ext1 }] }] })
  console.log('Update target+tools:', JSON.stringify({ result: res.result, messages: res.messages, maxLevel: res.maxLevel }))
  await execute({ 'v1.part.closeFeature': [{ id: boolId }] })

  await snapshot('updated-target-tools')
  return { boolId, updateResult: res.result }
}
