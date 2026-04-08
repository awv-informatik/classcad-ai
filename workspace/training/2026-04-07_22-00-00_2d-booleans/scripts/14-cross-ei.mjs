// 14 — Can you boolean shapes from different entity injections?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result

  const eif1 = (await api.v1.part.entityInjection({ id: partId })).result
  const s1 = (await api.v1.curve.shape({ id: eif1 })).result
  await api.v1.curve.circle({ id: s1, centerPos: [0, 0, 0], radius: 30 })

  const eif2 = (await api.v1.part.entityInjection({ id: partId })).result
  const s2 = (await api.v1.curve.shape({ id: eif2 })).result
  await api.v1.curve.circle({ id: s2, centerPos: [30, 0, 0], radius: 30 })

  const r = await api.v1.curve.union2d({ target: s1, tool: s2 })
  console.log('[14] cross-EI union maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[14] msg:', r.messages[0].message.slice(0, 120))

  const tree = r.structure?.tree
  console.log('[14] s1 exists:', !!tree?.[String(s1)])
  console.log('[14] s2 exists:', !!tree?.[String(s2)])

  await snapshot('cross-ei-union')
  return { partId }
}
