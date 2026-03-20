// 11b: updateBoolean — change name (with openFeature/closeFeature)
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'UpdateName' }] })).result

  const sk1 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l1 = (await execute({ 'v1.sketch.rectangle': [{ id: sk1, startPos: [0, 0, 0], endPos: [80, 80, 0] }] })).result
  const r1 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk1, geomIds: l1 }] })).result
  const ext1 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r1], limit2: 50 }] })).result

  const sk2 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l2 = (await execute({ 'v1.sketch.rectangle': [{ id: sk2, startPos: [20, 20, 0], endPos: [60, 60, 0] }] })).result
  const r2 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk2, geomIds: l2 }] })).result
  const ext2 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r2], limit2: 70 }] })).result

  const boolId = (await execute({ 'v1.part.boolean': [{ id: partId, type: 'UNION', target: ext1, tools: [ext2], name: 'OriginalName' }] })).result

  // Open, rename, close
  await execute({ 'v1.part.openFeature': [{ id: boolId }] })
  const res = await execute({ 'v1.part.updateBoolean': [{ id: boolId, name: 'RenamedBoolean' }] })
  console.log('Update name:', JSON.stringify({ result: res.result, messages: res.messages, maxLevel: res.maxLevel }))
  await execute({ 'v1.part.closeFeature': [{ id: boolId }] })

  return { boolId, updateResult: res.result }
}
