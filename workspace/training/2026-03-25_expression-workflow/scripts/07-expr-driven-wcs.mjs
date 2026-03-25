// Q: Expression-driven WCS: change expression → WCS offset changes → feature moves
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'ExprWCS' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'spacing', value: 50 },
      { name: 'boxH', value: 40 },
    ],
  })

  // Base box at origin
  await api.v1.part.box({
    id: partId, name: 'Base',
    length: 80, width: 80, height: '@expr.boxH',
  })

  // WCS driven by expression
  const wcsId = (await api.v1.part.workCSys({
    id: partId, name: 'StackWCS',
    offset: '[0, 0, @expr.spacing]',
  })).result

  // Second box placed at expression-driven WCS
  await api.v1.part.box({
    id: partId, name: 'Top',
    references: [wcsId],
    length: 60, width: 60, height: '@expr.boxH',
  })

  await snapshot('spacing50')

  // Change spacing — top box should move up
  await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'spacing', value: 120 }] })
  await api.v1.common.recalc()

  await snapshot('spacing120')
  console.log('[07] expr-driven WCS: ✓ updated spacing → top box moved')
  return { partId }
}
