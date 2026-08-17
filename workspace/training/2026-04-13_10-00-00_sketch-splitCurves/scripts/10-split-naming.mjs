// Test: Check naming convention and structure of split segments in detail
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Naming' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create various curves to check naming
  const line = (await api.v1.sketch.line({ id: skId, startPos: [-50, 20, 0], endPos: [50, 20, 0] })).result
  const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [0, -20, 0], radius: 15 })).result
  const arc = (await api.v1.sketch.arcByCenter({
    id: skId, centerPos: [0, 0, 0], startPos: [40, 0, 0], endPos: [0, 40, 0]
  })).result

  console.log('[10] line:', line, 'circle:', circle, 'arc:', arc)

  // Split all three
  const r = await api.v1.sketch.splitCurves({
    id: skId,
    splits: [
      { geomId: line, values: [0.5] },
      { geomId: circle, values: [0.25, 0.75] },
      { geomId: arc, values: [0.5] }
    ]
  })

  console.log('[10] result:', JSON.stringify(r.result))

  // Get structure to check names and classes
  const tree = r.structure.tree
  const allIds = r.result.flat()
  for (const id of allIds) {
    const node = tree[id]
    if (node) {
      console.log(`[10] id=${id} name=${node.name} class=${node.class} parent=${node.parent}`)
    } else {
      console.log(`[10] id=${id} — NOT FOUND in tree`)
    }
  }

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'naming-response')

  await snapshot('all-split')
  return { partId }
}
