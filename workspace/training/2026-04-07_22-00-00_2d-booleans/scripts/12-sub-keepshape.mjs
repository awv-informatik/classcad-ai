// 12 — subtraction2d and intersection2d with keepShape: true
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result

  // Test subtraction with keepShape
  const eif1 = (await api.v1.part.entityInjection({ id: partId })).result
  const s1 = (await api.v1.curve.shape({ id: eif1 })).result
  await api.v1.curve.polyline2d({ id: s1, points: [[0,0,0],[60,0,0],[60,40,0],[0,40,0]], close: true })
  const s2 = (await api.v1.curve.shape({ id: eif1 })).result
  await api.v1.curve.circle({ id: s2, centerPos: [50, 20, 0], radius: 15 })

  const rS = await api.v1.curve.subtraction2d({ target: s1, tool: s2, keepShape: true })
  console.log('[12] sub keepShape: maxLevel:', rS.maxLevel)
  const tree1 = rS.structure?.tree
  console.log('[12] s1 exists:', !!tree1?.[String(s1)])
  console.log('[12] s2 exists:', !!tree1?.[String(s2)], 'geoIds:', tree1?.[String(s2)]?.geometryIdList)

  await snapshot('sub-keepshape')

  // Test intersection with keepShape
  const eif2 = (await api.v1.part.entityInjection({ id: partId })).result
  const s3 = (await api.v1.curve.shape({ id: eif2 })).result
  await api.v1.curve.circle({ id: s3, centerPos: [0, 0, 0], radius: 30 })
  const s4 = (await api.v1.curve.shape({ id: eif2 })).result
  await api.v1.curve.circle({ id: s4, centerPos: [40, 0, 0], radius: 30 })

  const rI = await api.v1.curve.intersection2d({ target: s3, tool: s4, keepShape: true })
  console.log('[12] int keepShape: maxLevel:', rI.maxLevel)
  const tree2 = rI.structure?.tree
  console.log('[12] s3 exists:', !!tree2?.[String(s3)])
  console.log('[12] s4 exists:', !!tree2?.[String(s4)], 'geoIds:', tree2?.[String(s4)]?.geometryIdList)

  await snapshot('int-keepshape')
  return { partId }
}
