// 12 — Two intersecting circles. How do circle-circle intersections split?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitCircles' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  const c2 = (await api.v1.sketch.circle({ id: skId, centerPos: [40, 0, 0], radius: 30 })).result
  console.log('[12] c1:', c1, 'c2:', c2)

  await snapshot('before')

  const r = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[12] result:', JSON.stringify(r.result))
  console.log('[12] maxLevel:', r.maxLevel)
  console.log('[12] result length:', r.result?.length)

  const tree = r.structure?.tree
  if (tree) {
    for (const id of r.result) {
      const node = tree[String(id)]
      if (node) console.log('[12] segment', id, ':', node.class, node.name)
    }
  }

  filewrite({ result: r.result, maxLevel: r.maxLevel, c1, c2 }, 'circles-response')
  await snapshot('after')
  return { partId }
}
