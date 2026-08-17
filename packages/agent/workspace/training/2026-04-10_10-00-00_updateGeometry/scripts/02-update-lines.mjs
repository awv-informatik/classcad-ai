// Test: updateGeometry with lines — move start/end positions of existing lines
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create two lines forming an L shape
  const geo = await api.v1.sketch.geometry({
    id: skId,
    lines: [
      { startPos: [0, 0, 0], endPos: [50, 0, 0] },
      { startPos: [50, 0, 0], endPos: [50, 40, 0] },
    ],
    genFixation: false,
    genIncidence: false,
    genVertAndHoriz: false,
  })
  const [line1, line2] = geo.result.lines
  console.log('[02] created lines:', line1, line2)

  await snapshot('before')

  // Move line1 entirely, and change line2 start
  const r = await api.v1.sketch.updateGeometry({
    id: skId,
    lines: [
      { id: line1, startPos: [10, 10, 0], endPos: [60, 10, 0] },
      { id: line2, startPos: [60, 10, 0], endPos: [60, 60, 0] },
    ],
  })
  console.log('[02] updateGeometry result:', r.result)
  console.log('[02] maxLevel:', r.maxLevel)
  console.log('[02] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'update-lines-response')

  await snapshot('after')

  return { partId }
}
