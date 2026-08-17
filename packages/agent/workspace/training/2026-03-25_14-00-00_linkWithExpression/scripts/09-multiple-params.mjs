// Link multiple params of the same feature
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'L', value: 120 },
      { name: 'W', value: 80 },
      { name: 'H', value: 60 },
    ],
  })

  // Reference
  await api.v1.part.cylinder({ id: partId, diameter: 20, height: 60, position: [150, 0, 0] })

  const boxId = (await api.v1.part.box({
    id: partId, length: 40, width: 40, height: 40,
  })).result

  await snapshot('before')

  // Link all three dimensions
  await api.v1.part.linkWithExpression({ id: boxId, exprName: 'L', name: 'length' })
  await api.v1.part.linkWithExpression({ id: boxId, exprName: 'W', name: 'width' })
  await api.v1.part.linkWithExpression({ id: boxId, exprName: 'H', name: 'height' })
  await api.v1.common.recalc()
  await snapshot('after')

  return { partId, boxId }
}
