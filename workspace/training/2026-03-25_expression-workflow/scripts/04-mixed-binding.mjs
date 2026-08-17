// Q: Mixed binding: some params @expr at creation, some linked post-hoc, some plain
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'MixedBinding' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'L', value: 100 },
      { name: 'W', value: 70 },
      { name: 'H', value: 50 },
    ],
  })

  // Create box: length=@expr, width=plain, height=plain
  const boxId = (await api.v1.part.box({
    id: partId, name: 'MixedBox',
    length: '@expr.L',
    width: 40,       // plain
    height: 30,      // plain — will link post-hoc
  })).result

  await snapshot('initial-L100-W40-H30')

  // Link height post-hoc
  await api.v1.part.linkWithExpression({ id: boxId, exprName: 'H', name: 'height' })
  await api.v1.common.recalc()

  await snapshot('after-link-H-to-50')
  console.log('[04] after linking H: height should be 50')

  // Update both L and H
  await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [
      { name: 'L', value: 200 },
      { name: 'H', value: 100 },
    ],
  })
  await api.v1.common.recalc()

  await snapshot('after-update-L200-H100')
  console.log('[04] mixed binding: ✓ L=200 (from @expr), W=40 (plain), H=100 (linked)')
  return { partId, boxId }
}
