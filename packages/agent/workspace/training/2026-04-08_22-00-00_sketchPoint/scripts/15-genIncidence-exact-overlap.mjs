// Test genIncidence with EXACT overlap — does it create a coincidence constraint?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExactOverlap' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create first point at non-origin
  const r1 = await api.v1.sketch.point({ id: skId, pos: [30, 20, 0] })
  console.log('[15] first point:', r1.result)

  // Create second at exact same position, genIncidence=TRUE
  const r2 = await api.v1.sketch.point({ id: skId, pos: [30, 20, 0], genIncidence: true })
  console.log('[15] same pos, genIncidence=true:', r2.result, 'maxLevel:', r2.maxLevel)

  // Check for coincidence constraint
  const ids = Object.keys(r2.structure.tree).filter(k => +k >= 52).sort((a,b) => +a - +b)
  const nodes = ids.map(id => {
    const n = r2.structure.tree[id]
    return { id: +id, name: n.name, class: n.class }
  })
  console.log('[15] nodes:', JSON.stringify(nodes))

  // Also try genIncidence=false for comparison
  const r3 = await api.v1.sketch.point({ id: skId, pos: [30, 20, 0], genIncidence: false })
  console.log('[15] same pos, genIncidence=false:', r3.result, 'maxLevel:', r3.maxLevel)
  const ids3 = Object.keys(r3.structure.tree).filter(k => +k >= 52).sort((a,b) => +a - +b)
  const nodes3 = ids3.map(id => ({ id: +id, name: r3.structure.tree[id].name, class: r3.structure.tree[id].class }))
  console.log('[15] nodes after 3rd:', JSON.stringify(nodes3))

  filewrite({ withIncidence: nodes, withoutIncidence: nodes3 }, 'exact-overlap-comparison')
  return { partId, skId }
}
