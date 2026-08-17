export default async function (api, { snapshot, filewrite }) {
  // Clean self-reference test — no part.create between steps
  const partId = (await api.v1.part.create({ name: 'SelfRefClean' })).result
  const box1 = (await api.v1.part.box({ id: partId, name: 'Self', length: 60, width: 40, height: 30 })).result

  console.log('[19] partId:', partId, 'box1:', box1)

  // Self-reference: target === tool[0]
  const r = await api.v1.part.boolean({
    id: partId,
    type: 'UNION',
    target: box1,
    tools: [box1],
  })

  console.log('[19] self-ref UNION — result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'self-ref-clean')

  return { partId }
}
