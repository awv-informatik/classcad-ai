// 06 — Merge two disjoint (non-overlapping) boxes. Compare with overlapping merge.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DisjointMerge' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({ id: eifId, length: 80, width: 50, height: 40 })).result
  const box2 = (await api.v1.solid.box({
    id: eifId, length: 40, width: 30, height: 60,
    translation: [120, 0, 0]  // far apart, no overlap
  })).result

  console.log('[06] box1:', box1, 'box2:', box2)
  await snapshot('before-merge')

  const r = await api.v1.solid.merge({ id: eifId, target: box1, tools: [box2] })
  console.log('[06] merge result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[06] merge msgs:', JSON.stringify(r.messages))

  // Count meshes/edges
  if (r.graphic && r.graphic.containers) {
    for (const c of r.graphic.containers) {
      console.log('[06] container', c.id, ': meshes=', c.meshes?.length, 'edges=', c.edges?.length)
    }
  }

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'disjoint-merge-response')
  await snapshot('after-merge')

  return { partId }
}
