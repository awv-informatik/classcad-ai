// Multiple features sharing one expression — do ALL recalculate when expression changes?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'S', value: 50 },
    ],
  })

  // Two boxes, both driven by S
  const box1 = (await api.v1.part.box({
    id: partId,
    name: 'Box1',
    length: '@expr.S',
    width: '@expr.S',
    height: '@expr.S',
  })).result

  const box2 = (await api.v1.part.box({
    id: partId,
    name: 'Box2',
    length: '@expr.S * 2',
    width: '@expr.S',
    height: '@expr.S / 2',
  })).result

  await snapshot('before-shared-update')

  // Update S — both boxes should change
  await api.v1.part.updateExpression({ id: partId, name: 'S', value: 100 })

  await snapshot('after-shared-update')
  return { partId, box1, box2 }
}
