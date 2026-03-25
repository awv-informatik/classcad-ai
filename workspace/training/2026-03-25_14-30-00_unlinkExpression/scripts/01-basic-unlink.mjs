// Basic unlink: link, then unlink, verify value freezes at expression value
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'H', value: 120 }] })
  await api.v1.part.cylinder({ id: partId, diameter: 20, height: 80, position: [120, 0, 0] })

  const boxId = (await api.v1.part.box({
    id: partId, length: 80, width: 60, height: 40,
  })).result

  await api.v1.part.linkWithExpression({ id: boxId, exprName: 'H', name: 'height' })
  await api.v1.common.recalc()
  await snapshot('linked-h120')

  const ur = await api.v1.part.unlinkExpression({ id: boxId, name: 'height' })
  console.log('[01] unlink result:', JSON.stringify(ur.result), 'maxLevel:', ur.maxLevel)

  await api.v1.common.recalc()
  await snapshot('unlinked')

  return { partId, boxId }
}
