// Unlink multiple params from same feature (one at a time)
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'L', value: 120 },
      { name: 'W', value: 80 },
      { name: 'H', value: 60 },
    ],
  })

  const boxId = (await api.v1.part.box({
    id: partId, length: '@expr.L', width: '@expr.W', height: '@expr.H',
  })).result

  // Unlink all three
  await api.v1.part.unlinkExpression({ id: boxId, name: 'length' })
  await api.v1.part.unlinkExpression({ id: boxId, name: 'width' })
  await api.v1.part.unlinkExpression({ id: boxId, name: 'height' })

  // Update all expressions — box should not change
  await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [
      { name: 'L', value: 999 },
      { name: 'W', value: 999 },
      { name: 'H', value: 999 },
    ],
  })
  await api.v1.common.recalc()

  console.log('[10] all unlinked, expressions updated to 999. Box should still be 120x80x60.')
  return { partId, boxId }
}
