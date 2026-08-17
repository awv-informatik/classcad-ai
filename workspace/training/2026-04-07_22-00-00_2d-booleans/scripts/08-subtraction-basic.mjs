// 08 — Basic subtraction2d: subtract circle from rectangle
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Target: rectangle
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Target' })).result
  await api.v1.curve.polyline2d({
    id: s1,
    points: [[0, 0, 0], [80, 0, 0], [80, 60, 0], [0, 60, 0]],
    close: true,
  })

  // Tool: circle overlapping the right side
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Tool' })).result
  await api.v1.curve.circle({ id: s2, centerPos: [60, 30, 0], radius: 25 })

  const r = await api.v1.curve.subtraction2d({ target: s1, tool: s2 })
  console.log('[08] maxLevel:', r.maxLevel)
  console.log('[08] messages:', JSON.stringify(r.messages))

  const tree = r.structure?.tree
  console.log('[08] s1 exists:', !!tree?.[String(s1)], 'geoIds:', tree?.[String(s1)]?.geometryIdList)
  console.log('[08] s2 exists:', !!tree?.[String(s2)])

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'sub-response')

  await snapshot('after-subtraction')
  return { partId }
}
