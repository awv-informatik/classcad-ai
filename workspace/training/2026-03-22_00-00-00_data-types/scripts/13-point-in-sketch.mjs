// Q: How are points used in sketch APIs? Same [x,y,z] format?
// Also: do sketch APIs accept {x,y,z} objects?
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'Test' }] })).result

  // Create sketch on Top plane (XY plane, Z=0)
  const skId = (await execute({
    'v1.sketch.create': [{ id: partId }]
  })).result
  console.log('[13] sketchId:', skId)

  // 1. Rectangle with [x,y,z] points (z=0 for XY plane)
  const r1 = await execute({
    'v1.sketch.rectangle': [{
      id: skId,
      startPos: [0, 0, 0],
      endPos: [60, 40, 0]
    }]
  })
  console.log('[13] rect [x,y,z]:', r1.maxLevel <= 31 ? '✓' : '❌', 'lineIds:', r1.result)

  await snapshot('rect-array-format')

  // 2. Try with {x,y,z} object format
  await execute({ 'v1.common.clear': [{}] })
  const partId2 = (await execute({ 'v1.part.create': [{ name: 'Test2' }] })).result
  const skId2 = (await execute({
    'v1.sketch.create': [{ id: partId2 }]
  })).result

  const r2 = await execute({
    'v1.sketch.rectangle': [{
      id: skId2,
      startPos: { x: 0, y: 0, z: 0 },
      endPos: { x: 60, y: 40, z: 0 }
    }]
  })
  console.log('[13] rect {x,y,z}:', r2.maxLevel <= 31 ? '✓' : '❌')

  // 3. What about 2D points [x,y] in sketch context?
  await execute({ 'v1.common.clear': [{}] })
  const partId3 = (await execute({ 'v1.part.create': [{ name: 'Test3' }] })).result
  const skId3 = (await execute({
    'v1.sketch.create': [{ id: partId3 }]
  })).result

  const r3 = await execute({
    'v1.sketch.rectangle': [{
      id: skId3,
      startPos: [0, 0],
      endPos: [60, 40]
    }]
  })
  console.log('[13] rect 2D [x,y]:', r3.maxLevel <= 31 ? '✓' : '❌')
  if (r3.maxLevel > 31) console.log('[13] 2D error:', r3.messages.map(m => m.message).join('; '))

  // 4. What does sketch return for point-type data?
  // Read sketch geometry positions from structure tree
  if (r1.result && r1.result.length > 0) {
    const lineNode = r1.structure?.tree?.[String(r1.result[0])]
    if (lineNode) {
      console.log('[13] line node members:', JSON.stringify(lineNode.members))
    }
  }

  return {}
}
