// 07 — Move a rectangle (composed of 4 lines + auto-constraints)
// Key question: does moveGeometry move the whole rectangle as a rigid body?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [10, 10, 0], endPos: [60, 40, 0],
  })).result
  console.log('[07] rectIds:', JSON.stringify(rectIds))

  // Get positions of all 4 lines before
  const linesBefore = []
  for (const lid of rectIds) {
    linesBefore.push(await (await api.v1.sketch.getPositions({ id: lid })).result)
  }
  console.log('[07] lines before:', JSON.stringify(linesBefore))

  await snapshot('before')

  // Move just the first line — does the rest follow?
  const r1 = await api.v1.sketch.moveGeometry({ id: skId, geomIds: [rectIds[0]], translation: [20, 15, 0] })
  console.log('[07] move 1 line result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[07] move 1 line messages:', JSON.stringify(r1.messages))

  const linesAfterPartial = []
  for (const lid of rectIds) {
    linesAfterPartial.push(await (await api.v1.sketch.getPositions({ id: lid })).result)
  }
  console.log('[07] lines after partial move:', JSON.stringify(linesAfterPartial))

  await snapshot('after-partial')

  filewrite({
    linesBefore,
    linesAfterPartial,
    move1Result: r1.result,
    move1MaxLevel: r1.maxLevel,
    move1Messages: r1.messages,
  }, 'rect-partial-move')

  return { partId }
}
