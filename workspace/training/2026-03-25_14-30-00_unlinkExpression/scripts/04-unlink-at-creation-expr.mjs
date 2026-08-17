// Unlink a param that was set with @expr. at creation time
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'H', value: 100 }] })
  await api.v1.part.cylinder({ id: partId, diameter: 20, height: 60, position: [120, 0, 0] })

  const boxId = (await api.v1.part.box({
    id: partId, length: 80, width: 60, height: '@expr.H',
  })).result

  await snapshot('created-with-expr-h100')

  // Unlink
  const ur = await api.v1.part.unlinkExpression({ id: boxId, name: 'height' })
  console.log('[04] unlink @expr result:', JSON.stringify(ur.result), 'maxLevel:', ur.maxLevel)

  await api.v1.common.recalc()

  // Update H — should NOT affect box now
  await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'H', value: 200 }] })
  await api.v1.common.recalc()
  await snapshot('after-unlink-h200')

  return { partId, boxId }
}
