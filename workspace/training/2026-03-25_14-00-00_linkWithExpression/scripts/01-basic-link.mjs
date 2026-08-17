// Basic: create box with plain values, link height to expression
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'H', value: 120 }] })

  // Reference cylinder
  await api.v1.part.cylinder({ id: partId, diameter: 20, height: 80, position: [120, 0, 0] })

  const boxId = (await api.v1.part.box({
    id: partId, length: 80, width: 60, height: 40,
  })).result

  await snapshot('before-link')

  const lr = await api.v1.part.linkWithExpression({ id: boxId, exprName: 'H', name: 'height' })
  console.log('[01] link result:', JSON.stringify(lr.result), 'maxLevel:', lr.maxLevel)

  await api.v1.common.recalc()
  await snapshot('after-link')

  return { partId, boxId }
}
