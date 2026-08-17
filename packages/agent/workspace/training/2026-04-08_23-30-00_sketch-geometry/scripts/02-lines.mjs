// Test sketch.geometry — creating lines
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GeomTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const r = await api.v1.sketch.geometry({
    id: skId,
    lines: [
      { startPos: [0, 0, 0], endPos: [50, 0, 0] },
      { startPos: [50, 0, 0], endPos: [50, 30, 0] },
      { startPos: [50, 30, 0], endPos: [0, 0, 0] },
    ],
  })

  console.log('[02] result:', JSON.stringify(r.result))
  console.log('[02] maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'lines-response')

  await snapshot('lines')
  return { partId }
}
