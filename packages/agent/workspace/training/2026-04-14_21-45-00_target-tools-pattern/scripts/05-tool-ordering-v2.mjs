// Test: Tool ordering — compare structure trees (not graphic) for [A,B] vs [B,A]
// Use subtraction since it's the most visually obvious operation for ordering effects
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OrderV2' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Setup: box target, cylinder tool A (left), small box tool B (right)
  const target = (await api.v1.solid.box({ id: eifId, length: 100, width: 80, height: 60 })).result
  const toolA = (await api.v1.solid.cylinder({ id: eifId, diameter: 30, height: 80, translation: [25, 40, -10] })).result
  const toolB = (await api.v1.solid.box({ id: eifId, length: 25, width: 25, height: 80, translation: [65, 45, -10] })).result

  // Subtract [A, B]
  const rAB = await api.v1.solid.subtraction({ id: eifId, target, tools: [toolA, toolB] })
  console.log('[05] sub [A,B]: result=', rAB.result, 'maxLevel=', rAB.maxLevel)
  filewrite(rAB.structure, 'structure-AB')
  await snapshot('sub-AB')

  // Now start fresh for [B, A]
  await api.v1.solid.deleteSolid({ id: eifId }) // clear all

  const target2 = (await api.v1.solid.box({ id: eifId, length: 100, width: 80, height: 60 })).result
  const toolA2 = (await api.v1.solid.cylinder({ id: eifId, diameter: 30, height: 80, translation: [25, 40, -10] })).result
  const toolB2 = (await api.v1.solid.box({ id: eifId, length: 25, width: 25, height: 80, translation: [65, 45, -10] })).result

  const rBA = await api.v1.solid.subtraction({ id: eifId, target: target2, tools: [toolB2, toolA2] })
  console.log('[05] sub [B,A]: result=', rBA.result, 'maxLevel=', rBA.maxLevel)
  filewrite(rBA.structure, 'structure-BA')
  await snapshot('sub-BA')

  return { partId }
}
