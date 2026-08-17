// Chain references: a → b → c → d (multi-level dependency)
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'base', value: 5 },
      { name: 'doubled', value: 'base * 2' },           // 10
      { name: 'squared', value: 'doubled * doubled' },   // 100
      { name: 'rooted', value: 'sqrt(squared)' },        // 10
      { name: 'final', value: 'rooted + base' },         // 15
    ],
  })

  const names = ['base', 'doubled', 'squared', 'rooted', 'final']
  for (const name of names) {
    const r = await api.v1.part.getExpression({ id: partId, name })
    console.log(`[10] ${name} = ${r.result.value}`)
  }

  // Update base → entire chain should cascade
  await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'base', value: 3 }] })

  console.log('[10] --- after base=3 ---')
  for (const name of names) {
    const r = await api.v1.part.getExpression({ id: partId, name })
    console.log(`[10] ${name} = ${r.result.value}`)
  }

  return { partId }
}
