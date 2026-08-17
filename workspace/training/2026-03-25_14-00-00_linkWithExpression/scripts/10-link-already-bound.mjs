// Link a param that was already set with @expr. at creation
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'A', value: 50 },
      { name: 'B', value: 150 },
    ],
  })

  // Box height set with @expr.A at creation
  const boxId = (await api.v1.part.box({
    id: partId, length: 80, width: 60, height: '@expr.A',
  })).result

  // Re-link to B
  const lr = await api.v1.part.linkWithExpression({ id: boxId, exprName: 'B', name: 'height' })
  console.log('[10] relink result:', JSON.stringify(lr.result), 'maxLevel:', lr.maxLevel)

  await api.v1.common.recalc()
  return { partId, boxId }
}
