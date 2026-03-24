// Chain: base → derived → feature. Update base, recalc — does the chain cascade?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'base', value: 40 },
      { name: 'doubled', value: 'base * 2' },
      { name: 'tripled', value: 'base * 3' },
    ],
  })

  // Box uses derived expressions
  const boxId = (await api.v1.part.box({
    id: partId,
    name: 'CascadeBox',
    length: '@expr.tripled',
    width: '@expr.doubled',
    height: '@expr.base',
  })).result

  await snapshot('cascade-before')

  // Verify initial values
  let v = await api.v1.part.getExpression({ id: partId, name: 'doubled' })
  console.log('[13] doubled before:', v.result.value)

  // Update base — should cascade to doubled, tripled, and the box
  await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'base', value: 80 }],
  })
  await api.v1.common.recalc()

  v = await api.v1.part.getExpression({ id: partId, name: 'base' })
  console.log('[13] base after:', v.result.value)
  v = await api.v1.part.getExpression({ id: partId, name: 'doubled' })
  console.log('[13] doubled after:', v.result.value, '(expect 160)')
  v = await api.v1.part.getExpression({ id: partId, name: 'tripled' })
  console.log('[13] tripled after:', v.result.value, '(expect 240)')

  await snapshot('cascade-after')
  return { partId, boxId }
}
