// Re-link a param from one expression to another
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'A', value: 60 },
      { name: 'B', value: 120 },
    ],
  })

  const boxId = (await api.v1.part.box({
    id: partId, length: 80, width: 60, height: 40,
  })).result

  // Link to A
  const lr1 = await api.v1.part.linkWithExpression({ id: boxId, exprName: 'A', name: 'height' })
  console.log('[03] link A result:', JSON.stringify(lr1.result), 'maxLevel:', lr1.maxLevel)

  // Re-link to B (without unlinking first)
  const lr2 = await api.v1.part.linkWithExpression({ id: boxId, exprName: 'B', name: 'height' })
  console.log('[03] relink B result:', JSON.stringify(lr2.result), 'maxLevel:', lr2.maxLevel)

  await api.v1.common.recalc()

  return { partId, boxId }
}
