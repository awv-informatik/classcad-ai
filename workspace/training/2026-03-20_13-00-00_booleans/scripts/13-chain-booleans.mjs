// 13: Boolean on boolean — chain booleans
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'ChainBool' }] })).result

  // Box 1: base 100x100x50
  const sk1 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l1 = (await execute({ 'v1.sketch.rectangle': [{ id: sk1, startPos: [0, 0, 0], endPos: [100, 100, 0] }] })).result
  const r1 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk1, geomIds: l1 }] })).result
  const ext1 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r1], limit2: 50 }] })).result

  // Box 2: 60x60x70 at [10, 20]
  const sk2 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l2 = (await execute({ 'v1.sketch.rectangle': [{ id: sk2, startPos: [10, 20, 0], endPos: [70, 80, 0] }] })).result
  const r2 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk2, geomIds: l2 }] })).result
  const ext2 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r2], limit2: 70 }] })).result

  // Box 3: 30x30x90 at [50, 60]
  const sk3 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l3 = (await execute({ 'v1.sketch.rectangle': [{ id: sk3, startPos: [50, 60, 0], endPos: [80, 90, 0] }] })).result
  const r3 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk3, geomIds: l3 }] })).result
  const ext3 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r3], limit2: 90 }] })).result

  // Boolean 1: UNION ext1 + ext2
  const bool1 = (await execute({ 'v1.part.boolean': [{ id: partId, type: 'UNION', target: ext1, tools: [ext2] }] })).result
  await snapshot('after-first-union')

  // Boolean 2: SUBTRACTION bool1 - ext3 (use boolean feature as target)
  const bool2Res = await execute({ 'v1.part.boolean': [{ id: partId, type: 'SUBTRACTION', target: bool1, tools: [ext3] }] })
  console.log('Chain boolean:', JSON.stringify({ result: bool2Res.result, messages: bool2Res.messages, maxLevel: bool2Res.maxLevel }))
  await snapshot('after-chain-sub')

  return { bool1, bool2: bool2Res.result }
}
