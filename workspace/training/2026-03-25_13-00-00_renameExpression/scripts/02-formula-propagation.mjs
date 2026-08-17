// Does rename propagate to derived expression formulas?
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'base', value: 10 },
      { name: 'derived', value: 'base * 2' },
    ],
  })

  const beforeDerived = await api.v1.part.getExpression({ id: partId, name: 'derived' })
  console.log('[02] before derived:', JSON.stringify(beforeDerived.result))

  // Rename 'base' to 'foundation'
  await api.v1.part.renameExpression({
    id: partId,
    toRename: [{ name: 'base', newName: 'foundation' }],
  })

  const afterDerived = await api.v1.part.getExpression({ id: partId, name: 'derived' })
  console.log('[02] after derived:', JSON.stringify(afterDerived.result))
  console.log('[02] formula updated?', afterDerived.result.expression.includes('foundation'))

  return { partId }
}
