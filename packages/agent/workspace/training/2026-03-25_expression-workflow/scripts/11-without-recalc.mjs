// Q: What happens if you skip recalc? Does geometry stay stale?
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'NoRecalc' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'H', value: 40 }],
  })

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box',
    length: 80, width: 60, height: '@expr.H',
  })).result

  await snapshot('initial-h40')

  // Update expression but DON'T recalc
  await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'H', value: 200 }] })

  // Expression value changed...
  const hVal = (await api.v1.part.getExpression({ id: partId, name: 'H' })).result
  console.log('[11] H after update (no recalc):', hVal.value, '(should be 200)')

  await snapshot('after-update-no-recalc')
  console.log('[11] snapshot WITHOUT recalc — does geometry reflect the change?')

  // Now recalc
  await api.v1.common.recalc()
  await snapshot('after-recalc')
  console.log('[11] snapshot AFTER recalc — geometry should definitely reflect H=200 now')

  return { partId, boxId }
}
