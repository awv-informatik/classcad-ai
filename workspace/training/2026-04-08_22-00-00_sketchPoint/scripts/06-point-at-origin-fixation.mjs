// Test genFixation at origin specifically — "fixation in the Origin" per docs
// Also compare the full set of IDs created with genFixation=TRUE vs FALSE at origin
export default async function (api, { snapshot, filewrite }) {
  // Test 1: point at origin with genFixation=TRUE
  const p1 = (await api.v1.part.create({ name: 'FixAtOrigin' })).result
  const sk1 = (await api.v1.sketch.create({ id: p1 })).result
  const r1 = await api.v1.sketch.point({ id: sk1, pos: [0, 0, 0], genFixation: 1 })
  console.log('[06] origin point, genFixation=TRUE — result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Collect all IDs >= 52 (sketch objects) from structure
  const ids1 = Object.keys(r1.structure.tree).filter(k => +k >= 52).sort((a,b) => +a - +b)
  const nodes1 = ids1.map(id => ({ id: +id, name: r1.structure.tree[id].name, class: r1.structure.tree[id].class }))
  console.log('[06] genFixation=TRUE nodes:', JSON.stringify(nodes1))

  // Test 2: point at origin with genFixation=FALSE (fresh part)
  const p2 = (await api.v1.part.create({ name: 'NoFixAtOrigin' })).result
  const sk2 = (await api.v1.sketch.create({ id: p2 })).result
  const r2 = await api.v1.sketch.point({ id: sk2, pos: [0, 0, 0], genFixation: 0 })
  console.log('[06] origin point, genFixation=FALSE — result:', r2.result, 'maxLevel:', r2.maxLevel)

  const ids2 = Object.keys(r2.structure.tree).filter(k => +k >= 102).sort((a,b) => +a - +b)
  const nodes2 = ids2.map(id => ({ id: +id, name: r2.structure.tree[id].name, class: r2.structure.tree[id].class }))
  console.log('[06] genFixation=FALSE nodes:', JSON.stringify(nodes2))

  filewrite({ withFixation: nodes1, withoutFixation: nodes2 }, 'fixation-comparison')
  return { p1, sk1, p2, sk2 }
}
