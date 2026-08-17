// Does genIncidence trigger for nearby (not exactly overlapping) points?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IncidenceNear' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // First point
  const r1 = await api.v1.sketch.point({ id: skId, pos: [30, 20, 0] })
  console.log('[12] first point:', r1.result)

  // Second point very close (0.001 apart)
  const r2 = await api.v1.sketch.point({ id: skId, pos: [30.001, 20, 0] })
  console.log('[12] near point (30.001,20):', r2.result, 'maxLevel:', r2.maxLevel)

  // Check for coincidence constraint
  const ids2 = Object.keys(r2.structure.tree).filter(k => +k >= 52).sort((a,b) => +a - +b)
  const nodes2 = ids2.map(id => ({ id: +id, name: r2.structure.tree[id].name, class: r2.structure.tree[id].class }))
  console.log('[12] nodes after near point:', JSON.stringify(nodes2))

  // Third point further away (5 units apart)
  const r3 = await api.v1.sketch.point({ id: skId, pos: [35, 20, 0] })
  console.log('[12] far point (35,20):', r3.result, 'maxLevel:', r3.maxLevel)

  const ids3 = Object.keys(r3.structure.tree).filter(k => +k >= 52).sort((a,b) => +a - +b)
  const nodes3 = ids3.map(id => ({ id: +id, name: r3.structure.tree[id].name, class: r3.structure.tree[id].class }))
  console.log('[12] nodes after far point:', JSON.stringify(nodes3))

  filewrite({ nearNodes: nodes2, farNodes: nodes3 }, 'incidence-near-comparison')
  return { partId, skId }
}
