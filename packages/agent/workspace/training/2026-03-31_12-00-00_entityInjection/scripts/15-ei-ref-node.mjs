// 15 — Inspect the companion CC_OperationReference node created alongside entity injection
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RefNodeTest' })).result
  const r = await api.v1.part.entityInjection({ id: partId, name: 'TestEI' })
  const eifId = r.result
  console.log('[15] eifId:', eifId)

  // Find the companion reference node — from script 01 we know it's at eifId+2 with name "TestEIRef"
  const tree = r.structure?.tree
  const refId = eifId + 2
  const refNode = tree?.[refId]
  console.log('[15] refNode id:', refId, 'exists:', !!refNode)
  console.log('[15] refNode name:', refNode?.name)
  console.log('[15] refNode class:', refNode?.class)
  console.log('[15] refNode parent:', refNode?.parent)
  filewrite(refNode, 'ref-node')

  // Also check which parent nodes contain the EI
  const eiNode = tree?.[eifId]
  const eiParent = tree?.[eiNode?.parent]
  console.log('[15] EI parent id:', eiNode?.parent, 'class:', eiParent?.class, 'name:', eiParent?.name)

  const refParent = tree?.[refNode?.parent]
  console.log('[15] Ref parent id:', refNode?.parent, 'class:', refParent?.class, 'name:', refParent?.name)

  return { partId, eifId, refId }
}
