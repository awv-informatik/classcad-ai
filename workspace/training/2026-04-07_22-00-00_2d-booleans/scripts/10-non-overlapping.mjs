// 10 — What happens with non-overlapping shapes?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Two non-overlapping circles (separated by 100 units)
  const s1 = (await api.v1.curve.shape({ id: eifId })).result
  await api.v1.curve.circle({ id: s1, centerPos: [0, 0, 0], radius: 20 })

  const s2 = (await api.v1.curve.shape({ id: eifId })).result
  await api.v1.curve.circle({ id: s2, centerPos: [100, 0, 0], radius: 20 })

  // Union of non-overlapping
  const rU = await api.v1.curve.union2d({ target: s1, tool: s2 })
  console.log('[10] union non-overlap: maxLevel:', rU.maxLevel)
  if (rU.messages?.length) console.log('[10] union msg:', rU.messages[0].message.slice(0, 120))
  const tree1 = rU.structure?.tree
  console.log('[10] s1 after union:', !!tree1?.[String(s1)], 'geoIds:', tree1?.[String(s1)]?.geometryIdList)
  console.log('[10] s2 after union:', !!tree1?.[String(s2)])

  await snapshot('after-union-nooverlap')

  // Test subtraction of non-overlapping
  const eif2 = (await api.v1.part.entityInjection({ id: partId })).result
  const s3 = (await api.v1.curve.shape({ id: eif2 })).result
  await api.v1.curve.circle({ id: s3, centerPos: [0, 0, 0], radius: 20 })
  const s4 = (await api.v1.curve.shape({ id: eif2 })).result
  await api.v1.curve.circle({ id: s4, centerPos: [100, 0, 0], radius: 20 })

  const rS = await api.v1.curve.subtraction2d({ target: s3, tool: s4 })
  console.log('[10] subtraction non-overlap: maxLevel:', rS.maxLevel)
  if (rS.messages?.length) console.log('[10] sub msg:', rS.messages[0].message.slice(0, 120))

  // Test intersection of non-overlapping
  const eif3 = (await api.v1.part.entityInjection({ id: partId })).result
  const s5 = (await api.v1.curve.shape({ id: eif3 })).result
  await api.v1.curve.circle({ id: s5, centerPos: [0, 0, 0], radius: 20 })
  const s6 = (await api.v1.curve.shape({ id: eif3 })).result
  await api.v1.curve.circle({ id: s6, centerPos: [100, 0, 0], radius: 20 })

  const rI = await api.v1.curve.intersection2d({ target: s5, tool: s6 })
  console.log('[10] intersection non-overlap: maxLevel:', rI.maxLevel)
  if (rI.messages?.length) console.log('[10] int msg:', rI.messages[0].message.slice(0, 120))

  return { partId }
}
