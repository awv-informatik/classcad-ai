// Test copying different geometry types: arc, point
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CopyTypes' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a point
  const pt = (await api.v1.sketch.point({ id: skId, position: [10, 10, 0] })).result
  console.log('[09] point:', pt)

  // Create an arc
  const arc = (await api.v1.sketch.arcByCenter({
    id: skId,
    centerPos: [40, 20, 0],
    startPos: [40, 30, 0],
    endPos: [50, 20, 0]
  })).result
  console.log('[09] arc:', arc)

  await snapshot('before')

  // Copy point
  const rPt = await api.v1.sketch.copyGeometry({
    id: skId,
    geomIds: [pt],
    translation: [60, 0, 0],
    doCopyConstraints: false
  })
  console.log('[09] copy point result:', rPt.result, 'maxLevel:', rPt.maxLevel)

  // Copy arc
  const rArc = await api.v1.sketch.copyGeometry({
    id: skId,
    geomIds: [arc],
    translation: [60, 0, 0],
    doCopyConstraints: false
  })
  console.log('[09] copy arc result:', rArc.result, 'maxLevel:', rArc.maxLevel)

  filewrite({ pointCopy: rPt.result, arcCopy: rArc.result }, 'results')

  await snapshot('after')
  return { partId }
}
