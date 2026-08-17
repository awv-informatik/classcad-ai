// Wrong form: direct name/newName instead of toRename array
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'x', value: 50 }] })

  const rr = await api.v1.part.renameExpression({
    id: partId,
    name: 'x',
    newName: 'y',
  })
  console.log('[08] wrong form result:', rr.result, 'maxLevel:', rr.maxLevel)

  const rx = await api.v1.part.getExpression({ id: partId, name: 'x' })
  const ry = await api.v1.part.getExpression({ id: partId, name: 'y' })
  console.log('[08] x:', rx.result.value, 'y:', ry.result.value)
  console.log('[08] renamed?', rx.result.value === null && ry.result.value === 50)

  return { partId }
}
