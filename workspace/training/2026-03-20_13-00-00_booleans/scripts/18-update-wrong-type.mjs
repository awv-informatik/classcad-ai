// 18: updateBoolean on wrong feature type (extrusion, not boolean)
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'WrongType' }] })).result

  const sk1 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l1 = (await execute({ 'v1.sketch.rectangle': [{ id: sk1, startPos: [0, 0, 0], endPos: [50, 50, 0] }] })).result
  const r1 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk1, geomIds: l1 }] })).result
  const ext1 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r1], limit2: 50 }] })).result

  // Try openFeature + updateBoolean on an extrusion (not a boolean feature)
  await execute({ 'v1.part.openFeature': [{ id: ext1 }] })
  const res = await execute({ 'v1.part.updateBoolean': [{ id: ext1, type: 'UNION' }] })
  console.log('updateBoolean on extrusion:', JSON.stringify({ result: res.result, messages: res.messages, maxLevel: res.maxLevel }))
  await execute({ 'v1.part.closeFeature': [{ id: ext1 }] })

  return { result: res.result }
}
