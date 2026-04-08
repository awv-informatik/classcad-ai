// 07 — union2d with keepShape: true — tool should NOT be consumed
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Target' })).result
  await api.v1.curve.circle({ id: s1, centerPos: [0, 0, 0], radius: 30 })

  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Tool' })).result
  await api.v1.curve.circle({ id: s2, centerPos: [40, 0, 0], radius: 30 })

  const r = await api.v1.curve.union2d({ target: s1, tool: s2, keepShape: true })
  console.log('[07] maxLevel:', r.maxLevel)
  console.log('[07] messages:', JSON.stringify(r.messages))

  const tree = r.structure?.tree
  const s1node = tree?.[String(s1)]
  const s2node = tree?.[String(s2)]
  console.log('[07] s1 exists:', !!s1node, 'geoIds:', s1node?.geometryIdList)
  console.log('[07] s2 exists:', !!s2node, 'geoIds:', s2node?.geometryIdList)

  filewrite({ s1: s1node, s2: s2node }, 'after-keepshape')

  await snapshot('after-union-keepshape')
  return { partId, s1, s2 }
}
