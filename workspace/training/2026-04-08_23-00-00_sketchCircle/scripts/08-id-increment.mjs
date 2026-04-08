// 08 — ID increment pattern with all gen flags off
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IDPattern' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const ids = []
  for (let i = 0; i < 5; i++) {
    const r = await api.v1.sketch.circle({
      id: skId,
      centerPos: [i * 30, 0, 0],
      radius: 10,
      genFixation: false,
      genIncidence: false,
    })
    ids.push(r.result)
  }
  console.log('[08] IDs:', ids.join(', '))
  console.log('[08] gaps:', ids.slice(1).map((id, i) => id - ids[i]).join(', '))

  // Check structure for constraint-free sketch
  const geo = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[08] getGeometry:', JSON.stringify(geo.result))

  return { partId }
}
