// Q: Does the workflow work with multiple feature types (box + cylinder)?
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'MultiType' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'size', value: 60 },
      { name: 'ht', value: 40 },
    ],
  })

  // Box driven by expressions
  const boxId = (await api.v1.part.box({
    id: partId, name: 'MyBox',
    length: '@expr.size', width: '@expr.size', height: '@expr.ht',
  })).result

  // Cylinder driven by same expressions
  const wcsId = (await api.v1.part.workCSys({
    id: partId, name: 'CylOrigin',
    offset: [150, 0, 0],
  })).result

  const cylId = (await api.v1.part.cylinder({
    id: partId, name: 'MyCyl',
    references: [wcsId],
    diameter: '@expr.size', height: '@expr.ht',
  })).result

  await snapshot('initial-size60-ht40')

  // Update both
  await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [
      { name: 'size', value: 100 },
      { name: 'ht', value: 80 },
    ],
  })
  await api.v1.common.recalc()

  await snapshot('updated-size100-ht80')
  console.log('[08] multi-type: ✓ box and cylinder both driven by same expressions')
  return { partId, boxId, cylId }
}
