// Test doCopyConstraints=TRUE explicitly — does it also return null like default?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CopyConstrTrue' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a rectangle
  const rectLines = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [40, 30, 0] })).result
  console.log('[06] rectangle lines:', rectLines)

  // Copy WITH constraints explicitly
  const rTrue = await api.v1.sketch.copyGeometry({
    id: skId,
    geomIds: rectLines,
    translation: [60, 0, 0],
    doCopyConstraints: true
  })
  console.log('[06] doCopyConstraints=true result:', rTrue.result, 'maxLevel:', rTrue.maxLevel)
  filewrite({ result: rTrue.result, messages: rTrue.messages, maxLevel: rTrue.maxLevel }, 'copy-true-response')

  await snapshot('after-copy-true')

  return { partId }
}
