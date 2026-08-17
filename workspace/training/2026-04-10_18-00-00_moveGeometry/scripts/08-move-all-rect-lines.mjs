// 08 — Move all 4 lines of a rectangle together
// Does the whole rectangle move as a rigid unit?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [10, 10, 0], endPos: [60, 40, 0],
  })).result

  const linesBefore = []
  for (const lid of rectIds) {
    linesBefore.push(await (await api.v1.sketch.getPositions({ id: lid })).result)
  }

  await snapshot('before')

  // Move all 4 lines at once
  const r = await api.v1.sketch.moveGeometry({ id: skId, geomIds: rectIds, translation: [20, 15, 0] })
  console.log('[08] move all lines result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[08] messages:', JSON.stringify(r.messages))

  const linesAfter = []
  for (const lid of rectIds) {
    linesAfter.push(await (await api.v1.sketch.getPositions({ id: lid })).result)
  }

  filewrite({ linesBefore, linesAfter, moveResult: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'rect-full-move')

  await snapshot('after')

  return { partId }
}
