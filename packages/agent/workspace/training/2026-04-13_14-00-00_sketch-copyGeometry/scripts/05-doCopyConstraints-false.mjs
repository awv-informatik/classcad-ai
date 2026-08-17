// Test doCopyConstraints=FALSE — copy a constrained rectangle without constraints
// Then move one point of the copy to see if it's unconstrained (deforms freely)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NoCopyConstr' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a rectangle with constraints
  const rectLines = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [40, 30, 0] })).result
  console.log('[05] rectangle lines:', rectLines)

  // Copy WITHOUT constraints
  const r = await api.v1.sketch.copyGeometry({
    id: skId,
    geomIds: rectLines,
    translation: [60, 0, 0],
    doCopyConstraints: false
  })
  console.log('[05] copyGeometry result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'copy-response')

  await snapshot('after-copy-no-constraints')

  return { partId }
}
