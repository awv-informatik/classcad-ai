// Q: What happens if you rename an expression that's linked to a feature via @expr?
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'RenameLinked' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'oldName', value: 80 }],
  })

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box',
    length: 80, width: 60, height: '@expr.oldName',
  })).result

  await snapshot('before-rename')

  // Rename the expression
  const renResult = await api.v1.part.renameExpression({ id: partId, name: 'oldName', newName: 'newName' })
  console.log('[13] rename result:', renResult.result, 'maxLevel:', renResult.maxLevel)

  await api.v1.common.recalc()

  // Check if box still works
  await snapshot('after-rename')

  // Try updating with new name
  await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'newName', value: 150 }] })
  await api.v1.common.recalc()

  await snapshot('after-update-newname')
  console.log('[13] rename linked expr: does the feature follow the rename?')

  return { partId, boxId }
}
