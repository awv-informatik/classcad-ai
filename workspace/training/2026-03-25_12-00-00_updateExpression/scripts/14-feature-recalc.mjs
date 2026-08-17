// Test: update expression driving a box feature, verify recalc is needed
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create expression and box using it
  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'S', value: 60 }],
  })
  await api.v1.part.box({
    id: partId,
    name: 'TestBox',
    length: '@expr.S',
    width: '@expr.S',
    height: '@expr.S',
  })

  await snapshot('before-update')

  // Update expression WITHOUT recalc
  await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'S', value: 120 }],
  })

  // Expression value updated immediately
  const exprAfter = await api.v1.part.getExpression({ id: partId, name: 'S' })
  console.log('[14] expr value after update (no recalc):', exprAfter.result.value)

  await snapshot('after-update-no-recalc')

  // Now recalc
  await api.v1.common.recalc()
  await snapshot('after-recalc')

  console.log('[14] done — compare snapshots to see if recalc changed geometry')
  return { partId }
}
