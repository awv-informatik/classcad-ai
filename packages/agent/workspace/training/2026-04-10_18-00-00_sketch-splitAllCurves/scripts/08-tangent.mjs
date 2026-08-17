// 08 — Tangent intersection: line tangent to circle. Does it split?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitTangent' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Circle at origin r=30, horizontal line tangent at top (y=30)
  const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  const line = (await api.v1.sketch.line({ id: skId, startPos: [-50, 30, 0], endPos: [50, 30, 0] })).result
  console.log('[08] circle:', circle, 'line:', line)

  const r = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[08] result:', JSON.stringify(r.result))
  console.log('[08] maxLevel:', r.maxLevel)
  console.log('[08] result length:', r.result?.length)

  const tree = r.structure?.tree
  if (tree) {
    for (const id of r.result) {
      const node = tree[String(id)]
      if (node) console.log('[08] segment', id, ':', node.class, node.name)
    }
  }

  filewrite({ result: r.result, maxLevel: r.maxLevel, origCircle: circle, origLine: line }, 'tangent-response')
  await snapshot('tangent')
  return { partId }
}
