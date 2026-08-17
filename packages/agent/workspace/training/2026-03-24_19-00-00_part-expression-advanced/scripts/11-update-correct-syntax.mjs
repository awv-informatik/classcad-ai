// Fix: updateExpression uses toUpdate array, not direct name/value
// Also test whether recalc is needed after updating
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'size', value: 60 }],
  })

  const boxId = (await api.v1.part.box({
    id: partId,
    name: 'ParamBox',
    length: '@expr.size',
    width: '@expr.size',
    height: '@expr.size',
  })).result

  await snapshot('before')

  // Correct syntax: toUpdate array
  const r = await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'size', value: 120 }],
  })
  console.log('[11] updateExpression result:', r.result, 'maxLevel:', r.maxLevel)

  // Check value immediately (before recalc)
  const v1 = await api.v1.part.getExpression({ id: partId, name: 'size' })
  console.log('[11] size after update (pre-recalc):', JSON.stringify(v1.result))

  await snapshot('after-update-no-recalc')

  // Now recalc
  const rr = await api.v1.common.recalc()
  console.log('[11] recalc result:', rr.maxLevel)

  // Check value again
  const v2 = await api.v1.part.getExpression({ id: partId, name: 'size' })
  console.log('[11] size after recalc:', JSON.stringify(v2.result))

  await snapshot('after-recalc')

  return { partId, boxId }
}
