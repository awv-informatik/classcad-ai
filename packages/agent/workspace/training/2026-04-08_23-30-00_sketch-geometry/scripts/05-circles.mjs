// Test sketch.geometry — creating circles
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GeomTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const r = await api.v1.sketch.geometry({
    id: skId,
    circles: [
      { centerPos: [0, 0, 0], radius: 20 },
      { centerPos: [50, 0, 0], radius: 10 },
      { centerPos: [25, 30, 0], radius: 15 },
    ],
  })

  console.log('[05] result:', JSON.stringify(r.result))
  console.log('[05] maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'circles-response')

  await snapshot('circles')
  return { partId }
}
