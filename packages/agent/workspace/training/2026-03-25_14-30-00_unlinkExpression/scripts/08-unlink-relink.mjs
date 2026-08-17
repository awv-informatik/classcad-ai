// Unlink then re-link to a different expression
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'A', value: 60 },
      { name: 'B', value: 150 },
    ],
  })

  const boxId = (await api.v1.part.box({
    id: partId, length: 80, width: 60, height: '@expr.A',
  })).result

  // Unlink from A
  await api.v1.part.unlinkExpression({ id: boxId, name: 'height' })
  console.log('[08] unlinked from A')

  // Re-link to B
  const lr = await api.v1.part.linkWithExpression({ id: boxId, exprName: 'B', name: 'height' })
  console.log('[08] relink to B result:', JSON.stringify(lr.result), 'maxLevel:', lr.maxLevel)

  await api.v1.common.recalc()
  return { partId, boxId }
}
