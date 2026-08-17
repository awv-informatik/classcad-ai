// The docs say param can be object | Array<object> — test array form
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Pass param as an array of objects, each with id and toCreate
  const r = await api.v1.part.expression([
    {
      id: partId,
      toCreate: [{ name: 'a', value: 10 }],
    },
    {
      id: partId,
      toCreate: [{ name: 'b', value: 20 }],
    },
  ])
  console.log('[17] array param result:', r.result, typeof r.result)
  console.log('[17] maxLevel:', r.maxLevel)
  console.log('[17] messages:', JSON.stringify(r.messages))

  // Verify
  const va = await api.v1.common.evaluateExpression({ expression: 'a', id: 6 })
  const vb = await api.v1.common.evaluateExpression({ expression: 'b', id: 6 })
  console.log('[17] a =', va.result)
  console.log('[17] b =', vb.result)

  return { partId }
}
