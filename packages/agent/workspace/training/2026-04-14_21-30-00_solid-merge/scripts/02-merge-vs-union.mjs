// 02 — Compare merge vs union side by side. Same input geometry, different operations.
// Measure vertex counts, edge counts, face counts to see structural differences.
export default async function (api, { snapshot, filewrite }) {
  // --- MERGE ---
  const p1 = (await api.v1.part.create({ name: 'MergePart' })).result
  const eif1 = (await api.v1.part.entityInjection({ id: p1 })).result

  const mBox1 = (await api.v1.solid.box({ id: eif1, length: 100, width: 60, height: 40 })).result
  const mBox2 = (await api.v1.solid.box({
    id: eif1, length: 60, width: 40, height: 80,
    translation: [60, 30, 0]
  })).result

  const mergeR = await api.v1.solid.merge({ id: eif1, target: mBox1, tools: [mBox2] })
  console.log('[02] merge result:', mergeR.result, 'maxLevel:', mergeR.maxLevel)

  // Get graphic data for merge result
  const mergeGraphic = mergeR.graphic
  filewrite(mergeGraphic, 'merge-graphic')

  await snapshot('merge-result')

  // --- UNION ---
  const p2 = (await api.v1.part.create({ name: 'UnionPart' })).result
  const eif2 = (await api.v1.part.entityInjection({ id: p2 })).result

  const uBox1 = (await api.v1.solid.box({ id: eif2, length: 100, width: 60, height: 40 })).result
  const uBox2 = (await api.v1.solid.box({
    id: eif2, length: 60, width: 40, height: 80,
    translation: [60, 30, 0]
  })).result

  const unionR = await api.v1.solid.union({ id: eif2, target: uBox1, tools: [uBox2] })
  console.log('[02] union result:', unionR.result, 'maxLevel:', unionR.maxLevel)

  const unionGraphic = unionR.graphic
  filewrite(unionGraphic, 'union-graphic')

  await snapshot('union-result')

  // Compare graphic data
  if (mergeGraphic && unionGraphic) {
    // Count vertices for each solid in each result
    const summarize = (g, label) => {
      if (!g || !g.solids) { console.log(`[02] ${label}: no graphic.solids`); return }
      for (const s of g.solids) {
        const verts = s.vertices ? s.vertices.length / 3 : 0
        const edges = s.edges ? s.edges.length : 0
        console.log(`[02] ${label} solid ${s.id}: ${verts} verts, ${edges} edge arrays`)
      }
    }
    summarize(mergeGraphic, 'merge')
    summarize(unionGraphic, 'union')
  }

  // Also compare structure trees — count nodes
  const countNodes = (node) => {
    let count = 1
    if (node.children) for (const c of node.children) count += countNodes(c)
    return count
  }

  if (mergeR.structure) console.log('[02] merge structure nodes:', countNodes(mergeR.structure))
  if (unionR.structure) console.log('[02] union structure nodes:', countNodes(unionR.structure))

  return { p1, p2 }
}
