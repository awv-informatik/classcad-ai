// Test sketch.geometry — creating arcs by 3 points
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GeomTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const r = await api.v1.sketch.geometry({
    id: skId,
    arcsBy3Points: [
      { startPos: [0, 0, 0], endPos: [40, 0, 0], midPos: [20, 20, 0] },
      { startPos: [0, -10, 0], endPos: [40, -10, 0], midPos: [20, -30, 0] },
    ],
  })

  console.log('[03] result:', JSON.stringify(r.result))
  console.log('[03] maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'arcs3p-response')

  await snapshot('arcs3p')
  return { partId }
}
