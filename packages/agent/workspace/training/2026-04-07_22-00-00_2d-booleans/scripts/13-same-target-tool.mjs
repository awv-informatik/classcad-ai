// 13 — What happens when target and tool are the same shape?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const s1 = (await api.v1.curve.shape({ id: eifId })).result
  await api.v1.curve.circle({ id: s1, centerPos: [0, 0, 0], radius: 30 })

  // Union of shape with itself
  const rU = await api.v1.curve.union2d({ target: s1, tool: s1 })
  console.log('[13] union self: maxLevel:', rU.maxLevel)
  if (rU.messages?.length) console.log('[13] union msg:', rU.messages[0].message.slice(0, 120))
  console.log('[13] s1 after self-union:', !!rU.structure?.tree?.[String(s1)])

  // Subtraction of shape with itself
  const eif2 = (await api.v1.part.entityInjection({ id: partId })).result
  const s2 = (await api.v1.curve.shape({ id: eif2 })).result
  await api.v1.curve.circle({ id: s2, centerPos: [0, 0, 0], radius: 30 })

  const rS = await api.v1.curve.subtraction2d({ target: s2, tool: s2 })
  console.log('[13] sub self: maxLevel:', rS.maxLevel)
  if (rS.messages?.length) console.log('[13] sub msg:', rS.messages[0].message.slice(0, 120))
  console.log('[13] s2 after self-sub:', !!rS.structure?.tree?.[String(s2)])

  return { partId }
}
