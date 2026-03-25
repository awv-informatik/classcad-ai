// Inter-expression references: formulas referencing other expressions by name
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'a', value: 10 },
      { name: 'b', value: 20 },
      { name: 'sum', value: 'a + b' },
      { name: 'product', value: 'a * b' },
      { name: 'ratio', value: 'a / b' },
      { name: 'hypotenuse', value: 'sqrt(pow(a, 2) + pow(b, 2))' },
      { name: 'angle', value: 'atan(b, a)' },
      { name: 'area', value: 'a * b / 2' },
      { name: 'perimeter', value: '2 * (a + b)' },
      { name: 'diagonal', value: 'sqrt(a * a + b * b)' },
    ],
  })

  const names = ['a', 'b', 'sum', 'product', 'ratio', 'hypotenuse', 'angle', 'area', 'perimeter', 'diagonal']
  for (const name of names) {
    const r = await api.v1.part.getExpression({ id: partId, name })
    console.log(`[09] ${name} = ${r.result.value} (formula: '${r.result.expression || 'numeric'}')`)
  }

  return { partId }
}
