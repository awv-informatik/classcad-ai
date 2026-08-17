// 02 — entityInjection with custom name parameter
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  console.log('[02] partId:', partId)

  const r = await api.v1.part.entityInjection({ id: partId, name: 'MyInjection' })
  console.log('[02] result:', r.result, 'maxLevel:', r.maxLevel)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'named-ei-response')

  // Verify the name appears in the structure tree
  const node = r.structure?.tree?.[r.result]
  console.log('[02] node name:', node?.name)
  console.log('[02] node class:', node?.class)

  return { partId, eifId: r.result }
}
