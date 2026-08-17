// Deeper test: expression-driven workCSys offset with update + recalc
// Does the WCS offset update when expressions change?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'spacing', value: 50 },
    ],
  })

  // Base box at origin
  const box1 = (await api.v1.part.box({
    id: partId,
    name: 'Base',
    length: 40,
    width: 40,
    height: 40,
  })).result

  // WCS offset by expression
  const wcsId = (await api.v1.part.workCSys({
    id: partId,
    name: 'OffsetWCS',
    offset: '[@expr.spacing, 0, 0]',
  })).result

  // Second box at offset
  const box2 = (await api.v1.part.box({
    id: partId,
    name: 'Offset',
    references: [wcsId],
    length: 40,
    width: 40,
    height: 40,
  })).result

  await snapshot('spacing-before')

  // Double the spacing
  await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'spacing', value: 100 }],
  })
  await api.v1.common.recalc()

  await snapshot('spacing-after')
  return { partId }
}
