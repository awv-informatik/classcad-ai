// Multiple features sharing one expression — update + recalc
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'S', value: 50 }],
  })

  // Box1: cube of size S
  const box1 = (await api.v1.part.box({
    id: partId,
    name: 'SmallCube',
    length: '@expr.S',
    width: '@expr.S',
    height: '@expr.S',
  })).result

  // Box2: elongated, double length
  const box2 = (await api.v1.part.box({
    id: partId,
    name: 'LongBox',
    length: '@expr.S * 2',
    width: '@expr.S',
    height: '@expr.S / 2',
  })).result

  await snapshot('shared-before')

  // Update S and recalc
  await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'S', value: 100 }],
  })
  await api.v1.common.recalc()

  const v = await api.v1.part.getExpression({ id: partId, name: 'S' })
  console.log('[12] S after update+recalc:', JSON.stringify(v.result))

  await snapshot('shared-after')
  return { partId, box1, box2 }
}
