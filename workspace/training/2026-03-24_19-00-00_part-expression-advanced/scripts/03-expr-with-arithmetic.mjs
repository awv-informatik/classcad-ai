// Can you mix @expr.NAME with inline arithmetic in feature params?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'base', value: 80 },
      { name: 'margin', value: 10 },
    ],
  })

  // @expr.NAME + constant
  const r1 = await api.v1.part.box({
    id: partId,
    name: 'Box1',
    length: '@expr.base + 20',
    width: '@expr.base - 20',
    height: '@expr.base / 2',
  })
  console.log('[03] expr+arithmetic result:', r1.result, 'maxLevel:', r1.maxLevel)

  // @expr.NAME + @expr.NAME
  const r2 = await api.v1.part.cylinder({
    id: partId,
    name: 'Cyl1',
    diameter: '@expr.base - 2 * @expr.margin',
    height: '@expr.base + @expr.margin',
  })
  console.log('[03] two-expr arithmetic result:', r2.result, 'maxLevel:', r2.maxLevel)

  // @expr with function calls
  const r3 = await api.v1.part.box({
    id: partId,
    name: 'Box2',
    length: 'sqrt(@expr.base)',
    width: 'abs(-@expr.base)',
    height: 'max(@expr.base, @expr.margin) / 2',
  })
  console.log('[03] expr+functions result:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.maxLevel > 31) {
    console.log('[03] messages:', JSON.stringify(r3.messages))
  }

  await snapshot('expr-arithmetic')
  return { partId }
}
