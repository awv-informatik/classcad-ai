// Q: Can IDs from one domain be used in another? (e.g., part ID in common.setObjectName, sketch ID in common.setUserData)
export default async function ({ execute }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'Test' }] })).result
  const sketchId = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  console.log('[11] partId:', partId, 'sketchId:', sketchId)

  // common.setObjectName with sketch ID
  const r1 = await execute({ 'v1.common.setObjectName': [{ id: sketchId, name: 'MySketch' }] })
  console.log('[11] setObjectName on sketchId:', r1.maxLevel <= 31 ? '✓' : '❌')

  // common.setUserData on sketch ID
  const r2 = await execute({ 'v1.common.setUserData': [{ id: sketchId, key: 'layer', value: 'top' }] })
  console.log('[11] setUserData on sketchId:', r2.maxLevel <= 31 ? '✓' : '❌')

  // common.transformObjectWithMatrix — can you transform a work plane?
  const tree = (await execute({ 'v1.common.getAppVersion': [{}] })).structure?.tree || {}
  // Find a work plane ID
  let wpId = null
  for (const [k, n] of Object.entries(tree)) {
    if (n.class === 'CC_WorkPlane' && n.name === 'Top') { wpId = n.id; break }
  }
  console.log('[11] workPlaneId:', wpId)
  if (wpId) {
    const r3 = await execute({
      'v1.common.transformObjectWithMatrix': [{
        id: wpId,
        matrix: [[1,0,0,0],[0,1,0,0],[0,0,1,50],[0,0,0,1]]
      }]
    })
    console.log('[11] transform workPlane:', r3.maxLevel <= 31 ? '✓' : '❌', 'maxLevel:', r3.maxLevel, 'msgs:', JSON.stringify(r3.messages.map(m => m.message)))
  }

  // Can you use an internal child ID (like ExpressionSet) with common APIs?
  const r4 = await execute({ 'v1.common.setObjectName': [{ id: 6, name: 'RenamedExprSet' }] })
  console.log('[11] setObjectName on internal child (id=6 ExpressionSet):', r4.maxLevel <= 31 ? '✓' : '❌', 'maxLevel:', r4.maxLevel)
}
