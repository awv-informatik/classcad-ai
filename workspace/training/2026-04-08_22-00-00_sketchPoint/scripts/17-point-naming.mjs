// Study auto-naming pattern for points
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NamingTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const points = []
  for (let i = 0; i < 5; i++) {
    const r = await api.v1.sketch.point({ id: skId, pos: [i * 20, 0, 0] })
    const node = r.structure.tree[r.result]
    points.push({ id: r.result, name: node?.name, class: node?.class })
    console.log('[17] point', i, '— id:', r.result, 'name:', node?.name)
  }

  filewrite(points, 'naming-pattern')
  return { partId, skId }
}
