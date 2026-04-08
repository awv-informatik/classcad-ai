// 02 — batch circle creation
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BatchCircles' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const r = await api.v1.sketch.circle([
    { id: skId, centerPos: [0, 0, 0], radius: 10 },
    { id: skId, centerPos: [40, 0, 0], radius: 15 },
    { id: skId, centerPos: [20, 30, 0], radius: 8 },
  ])
  console.log('[02] batch result:', JSON.stringify(r.result), 'maxLevel:', r.maxLevel)

  // Verify getGeometry
  const geo = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[02] getGeometry:', JSON.stringify(geo.result))

  // ID analysis
  if (Array.isArray(r.result)) {
    const ids = r.result
    console.log('[02] IDs:', ids.join(', '))
    console.log('[02] gaps:', ids.slice(1).map((id, i) => id - ids[i]).join(', '))
  }

  await snapshot('batch-circles')
  return { partId }
}
