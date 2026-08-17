// 09 — T-junction: line endpoint touching another line's midpoint
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitTJunction' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Horizontal line, vertical line ending at its midpoint
  const horiz = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result
  const vert = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [0, 50, 0] })).result
  console.log('[09] horiz:', horiz, 'vert:', vert)

  const r = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[09] result:', JSON.stringify(r.result))
  console.log('[09] maxLevel:', r.maxLevel)
  console.log('[09] result length:', r.result?.length)

  const tree = r.structure?.tree
  if (tree) {
    for (const id of r.result) {
      const node = tree[String(id)]
      if (node) console.log('[09] segment', id, ':', node.class, node.name)
    }
  }

  filewrite({ result: r.result, maxLevel: r.maxLevel }, 't-junction-response')
  await snapshot('t-junction')
  return { partId }
}
