// 11 — Chain booleans: union A+B, then union result+C
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Three overlapping circles in a row
  const s1 = (await api.v1.curve.shape({ id: eifId })).result
  await api.v1.curve.circle({ id: s1, centerPos: [0, 0, 0], radius: 25 })

  const s2 = (await api.v1.curve.shape({ id: eifId })).result
  await api.v1.curve.circle({ id: s2, centerPos: [35, 0, 0], radius: 25 })

  const s3 = (await api.v1.curve.shape({ id: eifId })).result
  await api.v1.curve.circle({ id: s3, centerPos: [70, 0, 0], radius: 25 })

  // First union: s1 + s2
  const r1 = await api.v1.curve.union2d({ target: s1, tool: s2 })
  console.log('[11] first union maxLevel:', r1.maxLevel)

  // Second union: s1 (which now has s1+s2) + s3
  const r2 = await api.v1.curve.union2d({ target: s1, tool: s3 })
  console.log('[11] second union maxLevel:', r2.maxLevel)

  const tree = r2.structure?.tree
  console.log('[11] s1 exists:', !!tree?.[String(s1)], 'geoIds:', tree?.[String(s1)]?.geometryIdList)
  console.log('[11] s2 exists:', !!tree?.[String(s2)])
  console.log('[11] s3 exists:', !!tree?.[String(s3)])

  await snapshot('chained-union-3circles')
  return { partId }
}
