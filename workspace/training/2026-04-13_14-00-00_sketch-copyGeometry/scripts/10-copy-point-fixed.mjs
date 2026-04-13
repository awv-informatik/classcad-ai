// Test copying a point — fixed param name (pos, not position)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CopyPoint' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create point with correct param
  const pt = (await api.v1.sketch.point({ id: skId, pos: [10, 10, 0] })).result
  console.log('[10] point:', pt)

  // Create a line for reference
  const line = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0] })).result
  console.log('[10] line:', line)

  await snapshot('before')

  // Copy point with doCopyConstraints=false (to get IDs)
  const rPt = await api.v1.sketch.copyGeometry({
    id: skId,
    geomIds: [pt],
    translation: [30, 0, 0],
    doCopyConstraints: false
  })
  console.log('[10] copy point result:', rPt.result, 'maxLevel:', rPt.maxLevel)

  // Can we copy a mix of types at once?
  const rMix = await api.v1.sketch.copyGeometry({
    id: skId,
    geomIds: [pt, line],
    translation: [0, 30, 0],
    doCopyConstraints: false
  })
  console.log('[10] copy mixed result:', rMix.result, 'maxLevel:', rMix.maxLevel)

  filewrite({ pointCopy: rPt.result, mixedCopy: rMix.result }, 'results')

  await snapshot('after')
  return { partId }
}
