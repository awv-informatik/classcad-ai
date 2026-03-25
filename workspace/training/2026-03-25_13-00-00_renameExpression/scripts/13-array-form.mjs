// Array param form
export default async function (api) {
  const p1 = (await api.v1.part.create({ name: 'Part1' })).result
  const p2 = (await api.v1.part.create({ name: 'Part2' })).result
  await api.v1.part.expression({ id: p1, toCreate: [{ name: 'x', value: 1 }] })
  await api.v1.part.expression({ id: p2, toCreate: [{ name: 'x', value: 2 }] })

  const rr = await api.v1.part.renameExpression([
    { id: p1, toRename: [{ name: 'x', newName: 'y' }] },
    { id: p2, toRename: [{ name: 'x', newName: 'z' }] },
  ])
  console.log('[13] array form result:', rr.result, 'maxLevel:', rr.maxLevel)
  if (rr.messages?.length) {
    for (const m of rr.messages) console.log('[13] msg:', m.level, m.code, m.message)
  }

  return { p1, p2 }
}
