// Deep dive: what value does getExpression return after updating to a broken formula?
// Script 08 showed expression was stored but value=50 (unchanged from original).
// Is the value the OLD value, or recalculated with seed=1?
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create with value 77 (not 1, so we can distinguish from seed)
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'x', value: 77 }] })

  // Update to formula referencing undefined var
  const ur = await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'x', value: 'ghost + 99' }],
  })
  console.log('[12] update result:', ur.result, 'maxLevel:', ur.maxLevel)

  const after = await api.v1.part.getExpression({ id: partId, name: 'x' })
  console.log('[12] after:', JSON.stringify(after.result))
  console.log('[12] value is:', after.result.value === 77 ? 'old value (77)' :
    after.result.value === 1 ? 'seed value (1)' : `unexpected (${after.result.value})`)

  return { partId }
}
