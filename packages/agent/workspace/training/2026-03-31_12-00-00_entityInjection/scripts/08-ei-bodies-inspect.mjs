// 08 — Inspect EI structure after adding multiple solids
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BodiesTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  console.log('[08] partId:', partId, 'eifId:', eifId)

  // Add two solids
  const box1 = await api.v1.solid.box({ id: eifId, length: 100, width: 60, height: 40 })
  const box2 = await api.v1.solid.box({ id: eifId, length: 50, width: 50, height: 50, translation: [120, 0, 0] })
  console.log('[08] box1:', box1.result, 'box2:', box2.result)

  // Get the full EI node from the LAST response's structure tree
  const eiNode = box2.structure?.tree?.[eifId]
  filewrite(eiNode, 'ei-node-after-solids')
  console.log('[08] EI members.bodies:', JSON.stringify(eiNode?.members?.bodies))
  console.log('[08] EI children:', JSON.stringify(eiNode?.children))

  // Also check the part node to see if solids appear there
  const partNode = box2.structure?.tree?.[partId]
  console.log('[08] part.solids:', JSON.stringify(partNode?.solids))

  return { partId, eifId, box1: box1.result, box2: box2.result }
}
