// Get expressions with special values: 0, negative, very large, very small
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'zero', value: 0 },
      { name: 'negative', value: -42.5 },
      { name: 'large', value: 1e15 },
      { name: 'small', value: 1e-10 },
      { name: 'pi', value: 'C:PI' },
    ],
  })

  for (const name of ['zero', 'negative', 'large', 'small', 'pi']) {
    const r = await api.v1.part.getExpression({ id: partId, name })
    console.log(`[14] ${name}:`, JSON.stringify(r.result))
  }

  return { partId }
}
