// Test: updateGeometry with circles — change center and radius
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a circle
  const geo = await api.v1.sketch.geometry({
    id: skId,
    circles: [{ centerPos: [25, 25, 0], radius: 15 }],
    genFixation: false,
  })
  const [circId] = geo.result.circles
  console.log('[03] created circle:', circId)

  await snapshot('before')

  // Update center and radius
  const r = await api.v1.sketch.updateGeometry({
    id: skId,
    circles: [{ id: circId, centerPos: [50, 50, 0], radius: 30 }],
  })
  console.log('[03] updateGeometry result:', r.result)
  console.log('[03] maxLevel:', r.maxLevel)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'update-circles-response')

  await snapshot('after')

  return { partId }
}
