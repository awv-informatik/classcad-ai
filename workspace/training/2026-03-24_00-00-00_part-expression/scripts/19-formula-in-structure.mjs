// Test: how formula expressions appear in the structure tree
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'base', value: 50 },
      { name: 'derived', value: 'base * 2 + 10' },
      { name: 'piExpr', value: 'C:PI' },
    ],
  })

  // Get structure by creating another expression (to see the full response)
  const r = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'dummy', value: 0 }],
  })

  // Extract ExpressionSet members
  const exprSet = r.structure?.tree?.['6']?.members
  if (exprSet) {
    const relevant = {}
    for (const [k, v] of Object.entries(exprSet)) {
      if (['base', 'derived', 'piExpr', 'dummy'].includes(k)) {
        relevant[k] = v
      }
    }
    filewrite(relevant, 'expr-members')
  }

  return { partId }
}
