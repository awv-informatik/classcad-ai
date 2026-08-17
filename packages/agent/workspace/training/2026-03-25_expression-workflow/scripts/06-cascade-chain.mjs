// Q: Cascade: base expr → derived expr → feature param → update base → everything propagates
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Cascade' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'base', value: 50 },
      { name: 'doubled', value: 'base * 2' },
      { name: 'tripled', value: 'base * 3' },
    ],
  })

  // Verify derived values
  const d1 = (await api.v1.part.getExpression({ id: partId, name: 'doubled' })).result
  const t1 = (await api.v1.part.getExpression({ id: partId, name: 'tripled' })).result
  console.log('[06] initial: doubled=', d1.value, 'tripled=', t1.value)

  // Box uses derived expressions
  const boxId = (await api.v1.part.box({
    id: partId, name: 'CascadeBox',
    length: '@expr.tripled',
    width: '@expr.doubled',
    height: '@expr.base',
  })).result

  await snapshot('base50-L150-W100-H50')

  // Update base only — derived and feature should cascade
  await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'base', value: 80 }] })
  await api.v1.common.recalc()

  const d2 = (await api.v1.part.getExpression({ id: partId, name: 'doubled' })).result
  const t2 = (await api.v1.part.getExpression({ id: partId, name: 'tripled' })).result
  console.log('[06] after: doubled=', d2.value, 'tripled=', t2.value)

  await snapshot('base80-L240-W160-H80')
  console.log('[06] cascade: ✓ base → derived → feature all updated')
  return { partId, boxId }
}
