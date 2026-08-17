// Q: Link all three box dimensions to expressions post-hoc, then update all at once
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'LinkAll' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'L', value: 120 },
      { name: 'W', value: 80 },
      { name: 'H', value: 60 },
    ],
  })

  // Create box with plain values
  const boxId = (await api.v1.part.box({
    id: partId, name: 'PlainBox',
    length: 50, width: 50, height: 50,
  })).result

  await snapshot('plain-50x50x50')

  // Link all three params post-hoc
  await api.v1.part.linkWithExpression({ id: boxId, exprName: 'L', name: 'length' })
  await api.v1.part.linkWithExpression({ id: boxId, exprName: 'W', name: 'width' })
  await api.v1.part.linkWithExpression({ id: boxId, exprName: 'H', name: 'height' })
  await api.v1.common.recalc()

  await snapshot('linked-120x80x60')
  console.log('[14] after linking all: should be 120x80x60')

  // Update all at once
  await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [
      { name: 'L', value: 200 },
      { name: 'W', value: 150 },
      { name: 'H', value: 100 },
    ],
  })
  await api.v1.common.recalc()

  await snapshot('updated-200x150x100')
  console.log('[14] link all params: ✓ all three dimensions updated via expressions')
  return { partId, boxId }
}
