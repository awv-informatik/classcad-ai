// Test sketch.geometry — creating arcs by center
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GeomTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const r = await api.v1.sketch.geometry({
    id: skId,
    arcsByCenter: [
      { startPos: [0, 20, 0], endPos: [20, 0, 0], centerPos: [0, 0, 0], isClockwise: true },
      { startPos: [30, 20, 0], endPos: [50, 0, 0], centerPos: [30, 0, 0], isClockwise: false },
    ],
  })

  console.log('[04] result:', JSON.stringify(r.result))
  console.log('[04] maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'arcsByCenter-response')

  await snapshot('arcsByCenter')
  return { partId }
}
