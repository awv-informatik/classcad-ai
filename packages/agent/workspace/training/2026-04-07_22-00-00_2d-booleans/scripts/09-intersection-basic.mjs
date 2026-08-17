// 09 — Basic intersection2d: keep only overlap between two circles
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Target' })).result
  await api.v1.curve.circle({ id: s1, centerPos: [0, 0, 0], radius: 30 })

  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Tool' })).result
  await api.v1.curve.circle({ id: s2, centerPos: [40, 0, 0], radius: 30 })

  const r = await api.v1.curve.intersection2d({ target: s1, tool: s2 })
  console.log('[09] maxLevel:', r.maxLevel)
  console.log('[09] messages:', JSON.stringify(r.messages))

  const tree = r.structure?.tree
  console.log('[09] s1 exists:', !!tree?.[String(s1)], 'geoIds:', tree?.[String(s1)]?.geometryIdList)
  console.log('[09] s2 exists:', !!tree?.[String(s2)])

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'int-response')

  await snapshot('after-intersection')
  return { partId }
}
