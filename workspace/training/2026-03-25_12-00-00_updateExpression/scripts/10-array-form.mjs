// Test array form: update expressions in multiple parts in one call
export default async function (api) {
  const p1 = (await api.v1.part.create({ name: 'Part1' })).result
  const p2 = (await api.v1.part.create({ name: 'Part2' })).result

  await api.v1.part.expression({ id: p1, toCreate: [{ name: 'val', value: 1 }] })
  await api.v1.part.expression({ id: p2, toCreate: [{ name: 'val', value: 2 }] })

  // Array form: update both parts
  const ur = await api.v1.part.updateExpression([
    { id: p1, toUpdate: [{ name: 'val', value: 100 }] },
    { id: p2, toUpdate: [{ name: 'val', value: 200 }] },
  ])
  console.log('[10] array form result:', ur.result, 'maxLevel:', ur.maxLevel)

  const r1 = await api.v1.part.getExpression({ id: p1, name: 'val' })
  const r2 = await api.v1.part.getExpression({ id: p2, name: 'val' })
  console.log('[10] p1 val:', r1.result.value, 'p2 val:', r2.result.value)

  return { p1, p2 }
}
