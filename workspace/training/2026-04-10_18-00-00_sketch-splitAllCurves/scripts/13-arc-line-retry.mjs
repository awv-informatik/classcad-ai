// 13 — Arc + line retry: make sure they truly intersect.
// Use a semicircle arc and a line that clearly crosses it.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitArcRetry' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Semicircle arc from (30,0) through (0,30) to (-30,0) — full upper half
  const arc = (await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [30, 0, 0],
    midPos: [0, 30, 0],
    endPos: [-30, 0, 0]
  })).result

  // Horizontal line through y=15 — clearly crosses the semicircle
  const line = (await api.v1.sketch.line({ id: skId, startPos: [-50, 15, 0], endPos: [50, 15, 0] })).result
  console.log('[13] arc:', arc, 'line:', line)

  await snapshot('before')

  const r = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[13] result:', JSON.stringify(r.result))
  console.log('[13] maxLevel:', r.maxLevel)
  console.log('[13] result length:', r.result?.length)

  const tree = r.structure?.tree
  if (tree) {
    for (const id of r.result) {
      const node = tree[String(id)]
      if (node) console.log('[13] segment', id, ':', node.class, node.name)
    }
  }

  filewrite({ result: r.result, maxLevel: r.maxLevel }, 'arc-retry-response')
  await snapshot('after')
  return { partId }
}
