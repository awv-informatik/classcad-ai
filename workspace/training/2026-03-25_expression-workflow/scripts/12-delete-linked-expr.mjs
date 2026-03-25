// Q: What happens if you delete an expression that's linked to a feature?
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'DeleteLinked' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'H', value: 80 }],
  })

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box',
    length: 80, width: 60, height: '@expr.H',
  })).result

  await snapshot('before-delete')

  // Delete the expression that's driving the box
  const delResult = await api.v1.part.deleteExpression({ id: partId, name: 'H' })
  console.log('[12] deleteExpression result:', delResult.result, 'maxLevel:', delResult.maxLevel)
  if (delResult.messages) {
    for (const m of delResult.messages) {
      console.log('[12] msg:', m.message, 'level:', m.level)
    }
  }

  await api.v1.common.recalc()
  await snapshot('after-delete-expr')
  console.log('[12] delete linked expr: what happens to the box?')

  return { partId, boxId }
}
