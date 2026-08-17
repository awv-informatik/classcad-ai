// 02 — union2d with circles (inherently closed shapes)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoolTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Shape 1: circle at origin, r=30
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Target' })).result
  await api.v1.curve.circle({ id: s1, centerPos: [0, 0, 0], radius: 30 })

  // Shape 2: circle offset by [25, 0], r=30 — overlapping
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Tool' })).result
  await api.v1.curve.circle({ id: s2, centerPos: [25, 0, 0], radius: 30 })

  await snapshot('before-union')

  // Perform union
  const r = await api.v1.curve.union2d({ target: s1, tool: s2 })
  console.log('[02] union2d result:', r.result)
  console.log('[02] maxLevel:', r.maxLevel)
  console.log('[02] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'union-response')

  await snapshot('after-union')

  return { partId, s1, s2 }
}
