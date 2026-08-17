// 11 — Inspect NoneSplitted vs SplittedCurves containers in detail
// Mix of intersecting and non-intersecting curves
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitContainers' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Two intersecting lines + one isolated line
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [0, -50, 0], endPos: [0, 50, 0] })).result
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [70, 0, 0], endPos: [70, 40, 0] })).result
  console.log('[11] l1:', l1, 'l2:', l2, 'l3 (isolated):', l3)

  const r = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[11] result:', JSON.stringify(r.result))
  console.log('[11] result length:', r.result?.length)

  const tree = r.structure?.tree
  if (tree) {
    // Find NoneSplitted and SplittedCurves containers
    for (const [k, v] of Object.entries(tree)) {
      if (v.name === 'NoneSplitted' || v.name === 'SplittedCurves') {
        const children = Object.entries(tree).filter(([_, n]) => n.parent === parseInt(k))
        console.log('[11]', v.name, '(id:', k, ') children:',
          children.map(([_, n]) => `${n.name} (${n.id}, ${n.class})`).join(', '))
      }
    }
    // Check where isolated line l3 ended up
    for (const id of r.result) {
      const node = tree[String(id)]
      if (node) {
        const parentNode = tree[String(node.parent)]
        console.log('[11] segment', id, ':', node.class, node.name, '→ container:', parentNode?.name)
      }
    }
  }

  // Does l3 appear in result as its original ID?
  console.log('[11] l3 in result?', r.result?.includes(l3))

  filewrite({ result: r.result, maxLevel: r.maxLevel, origIds: { l1, l2, l3 } }, 'containers-response')
  filewrite(r.structure, 'containers-structure')
  await snapshot('containers')
  return { partId }
}
