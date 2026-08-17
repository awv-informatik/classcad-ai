// Follow-up on script 10: check if array form partially applied
export default async function (api) {
  const p1 = (await api.v1.part.create({ name: 'Part1' })).result
  const p2 = (await api.v1.part.create({ name: 'Part2' })).result

  await api.v1.part.expression({ id: p1, toCreate: [{ name: 'val', value: 1 }] })
  await api.v1.part.expression({ id: p2, toCreate: [{ name: 'val', value: 2 }] })

  // Array form
  const ur = await api.v1.part.updateExpression([
    { id: p1, toUpdate: [{ name: 'val', value: 100 }] },
    { id: p2, toUpdate: [{ name: 'val', value: 200 }] },
  ])
  console.log('[11] array form result:', ur.result, 'maxLevel:', ur.maxLevel)
  if (ur.messages?.length) {
    for (const m of ur.messages) console.log('[11] msg:', m.level, m.code, m.message)
  }

  // Check if anything was applied
  const r1 = (await api.v1.part.getExpression({ id: p1, name: 'val' })).result
  const r2 = (await api.v1.part.getExpression({ id: p2, name: 'val' })).result
  console.log('[11] p1 val:', r1.value, 'p2 val:', r2.value)

  return { p1, p2 }
}
