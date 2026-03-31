// 15 — Can you create shapes in different EIs? Cross-EI shape behavior.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const ei1 = (await api.v1.part.entityInjection({ id: partId, name: 'EI1' })).result
  const ei2 = (await api.v1.part.entityInjection({ id: partId, name: 'EI2' })).result

  const s1 = (await api.v1.curve.shape({ id: ei1, name: 'ShapeInEI1' })).result
  const s2 = (await api.v1.curve.shape({ id: ei2, name: 'ShapeInEI2' })).result

  console.log('[15] ei1:', ei1, 'ei2:', ei2, 's1:', s1, 's2:', s2)

  // Add curves to both
  await api.v1.curve.line({ id: s1, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  await api.v1.curve.circle({ id: s2, centerPos: [25, 25, 0], radius: 15 })

  const r = await api.v1.common.getAppVersion({})
  const tree = r.structure.tree

  // Check parents
  const s1Parent = tree[String(s1)]?.parent
  const s2Parent = tree[String(s2)]?.parent
  console.log('[15] s1 parent:', s1Parent, '(should be', ei1, ')')
  console.log('[15] s2 parent:', s2Parent, '(should be', ei2, ')')

  await snapshot('shapes-in-two-eis')

  filewrite({ s1: { id: s1, parent: s1Parent }, s2: { id: s2, parent: s2Parent } }, 'cross-ei')

  return {}
}
