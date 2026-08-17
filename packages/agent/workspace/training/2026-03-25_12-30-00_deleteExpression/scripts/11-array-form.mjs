// Array param form: delete from multiple parts
export default async function (api) {
  const p1 = (await api.v1.part.create({ name: 'Part1' })).result
  const p2 = (await api.v1.part.create({ name: 'Part2' })).result

  await api.v1.part.expression({ id: p1, toCreate: [{ name: 'val', value: 1 }] })
  await api.v1.part.expression({ id: p2, toCreate: [{ name: 'val', value: 2 }] })

  const dr = await api.v1.part.deleteExpression([
    { id: p1, toDelete: ['val'] },
    { id: p2, toDelete: ['val'] },
  ])
  console.log('[11] array form result:', dr.result, 'maxLevel:', dr.maxLevel)
  if (dr.messages?.length) {
    for (const m of dr.messages) console.log('[11] msg:', m.level, m.code, m.message)
  }

  const r1 = (await api.v1.part.getExpression({ id: p1, name: 'val' })).result
  const r2 = (await api.v1.part.getExpression({ id: p2, name: 'val' })).result
  console.log('[11] p1 val:', r1.value, 'p2 val:', r2.value)

  return { p1, p2 }
}
