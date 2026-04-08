// 06 — Basic union2d: two overlapping circles, snapshot AFTER only
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Two overlapping circles
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Target' })).result
  await api.v1.curve.circle({ id: s1, centerPos: [0, 0, 0], radius: 30 })

  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Tool' })).result
  await api.v1.curve.circle({ id: s2, centerPos: [40, 0, 0], radius: 30 })

  // Perform union — NO snapshot before this
  const r = await api.v1.curve.union2d({ target: s1, tool: s2 })
  console.log('[06] result:', r.result)
  console.log('[06] maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'union-response')

  // Snapshot AFTER the boolean
  await snapshot('after-union')

  // Check structure: does s1 still exist? Is s2 consumed?
  const tree = r.structure?.tree
  const s1node = tree?.[String(s1)]
  const s2node = tree?.[String(s2)]
  console.log('[06] s1 exists:', !!s1node, 'name:', s1node?.name, 'geoIds:', s1node?.geometryIdList)
  console.log('[06] s2 exists:', !!s2node, 'name:', s2node?.name, 'geoIds:', s2node?.geometryIdList)

  filewrite({ s1: s1node, s2: s2node }, 'shape-nodes-after')

  return { partId, s1, s2 }
}
