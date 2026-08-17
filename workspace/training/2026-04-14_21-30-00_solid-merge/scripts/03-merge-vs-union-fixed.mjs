// 03 — Merge vs union comparison in separate EIFs within the same part.
// Also log all messages to understand any errors.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Comparison' })).result

  // --- MERGE in EIF 1 ---
  const eif1 = (await api.v1.part.entityInjection({ id: partId })).result

  const mBox1 = (await api.v1.solid.box({ id: eif1, length: 100, width: 60, height: 40 })).result
  const mBox2 = (await api.v1.solid.box({
    id: eif1, length: 60, width: 40, height: 80,
    translation: [60, 30, 0]
  })).result

  const mergeR = await api.v1.solid.merge({ id: eif1, target: mBox1, tools: [mBox2] })
  console.log('[03] merge result:', mergeR.result, 'maxLevel:', mergeR.maxLevel)
  console.log('[03] merge msgs:', JSON.stringify(mergeR.messages))

  // Count verts in merge graphic
  if (mergeR.graphic && mergeR.graphic.solids) {
    for (const s of mergeR.graphic.solids) {
      const verts = s.vertices ? s.vertices.length / 3 : 0
      console.log('[03] merge solid', s.id, ':', verts, 'verts')
    }
  }

  await snapshot('merge')

  // --- UNION in EIF 2 ---
  const eif2 = (await api.v1.part.entityInjection({ id: partId })).result

  const uBox1 = (await api.v1.solid.box({ id: eif2, length: 100, width: 60, height: 40, translation: [0, 0, 100] })).result
  const uBox2 = (await api.v1.solid.box({
    id: eif2, length: 60, width: 40, height: 80,
    translation: [60, 30, 100]
  })).result

  const unionR = await api.v1.solid.union({ id: eif2, target: uBox1, tools: [uBox2] })
  console.log('[03] union result:', unionR.result, 'maxLevel:', unionR.maxLevel)
  console.log('[03] union msgs:', JSON.stringify(unionR.messages))

  if (unionR.graphic && unionR.graphic.solids) {
    for (const s of unionR.graphic.solids) {
      const verts = s.vertices ? s.vertices.length / 3 : 0
      console.log('[03] union solid', s.id, ':', verts, 'verts')
    }
  }

  await snapshot('both')

  // Save both graphics for diff
  filewrite(mergeR.graphic, 'merge-graphic')
  filewrite(unionR.graphic, 'union-graphic')

  return { partId }
}
