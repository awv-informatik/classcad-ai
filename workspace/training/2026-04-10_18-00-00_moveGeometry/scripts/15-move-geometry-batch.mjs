// 15 — Move geometry created via batch (sketch.geometry)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const geo = await api.v1.sketch.geometry({
    id: skId,
    points: [{ pos: [5, 5, 0] }],
    lines: [
      { startPos: [10, 0, 0], endPos: [50, 0, 0] },
      { startPos: [50, 0, 0], endPos: [50, 30, 0] },
    ],
    circles: [{ centerPos: [70, 20, 0], radius: 12 }],
    genFixation: false,
  })
  console.log('[15] batch geo:', JSON.stringify(geo.result))

  const allIds = [
    ...geo.result.points,
    ...geo.result.lines,
    ...geo.result.circles,
  ]
  console.log('[15] allIds:', allIds)

  await snapshot('before')

  // Move everything
  const r = await api.v1.sketch.moveGeometry({ id: skId, geomIds: allIds, translation: [15, 25, 0] })
  console.log('[15] moveGeometry result:', r.result, 'maxLevel:', r.maxLevel)

  // Verify one line moved correctly
  const lineAfter = (await api.v1.sketch.getPositions({ id: geo.result.lines[0] })).result
  console.log('[15] line0 after:', JSON.stringify(lineAfter))
  console.log('[15] expected start: [25,25,0]')

  filewrite({ moveResult: r.result, maxLevel: r.maxLevel, lineAfter }, 'batch-move')

  await snapshot('after')

  return { partId }
}
