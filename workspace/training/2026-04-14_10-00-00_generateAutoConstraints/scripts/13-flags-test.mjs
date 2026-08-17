// Test: flags parameter validation — do the flags at least get accepted?
// Also test: does autoGen detect coincidence between a standalone point
// and a line endpoint at the same position?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'FlagsTest2' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Create a standalone point at the origin FIRST
  const pt = (await api.v1.sketch.point({ id: skId, pos: [25, 0, 0] })).result
  console.log('[13] point created:', pt)

  // Now create a horizontal line from the origin
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  console.log('[13] line created:', l1)

  // Check constraints from creation
  const geoR = await api.v1.sketch.getGeometry({ id: skId })
  const consBefore = Object.values(geoR.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[13] constraints from creation:', consBefore.length)
  filewrite(consBefore.map(c => ({ id: c.id, class: c.class, name: c.name })), 'constraints-before')

  // Test all flag combinations
  const tests = [
    { label: 'all-default', params: {} },
    { label: 'no-fixation', params: { genFixation: false } },
    { label: 'no-incidence', params: { genIncidence: false } },
    { label: 'no-tangency', params: { genTangency: false } },
    { label: 'no-hv', params: { genVertAndHoriz: false } },
    { label: 'all-off', params: { genFixation: false, genIncidence: false, genTangency: false, genVertAndHoriz: false } },
  ]

  for (const t of tests) {
    const r = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: l1, ...t.params })
    const cons = Object.values(r.structure.tree)
      .filter(n => n.class && n.class.includes('Constraint'))
    console.log(`[13] ${t.label}: maxLevel=${r.maxLevel} cons=${cons.length} msgs=${JSON.stringify(r.messages)}`)
  }

  // Also try autoGen on the point
  const rPt = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: pt })
  const consAfterPt = Object.values(rPt.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[13] autoGen point: maxLevel=', rPt.maxLevel, 'cons=', consAfterPt.length)

  const newCons = consAfterPt.filter(c => !consBefore.find(b => b.id === c.id))
  console.log('[13] new constraints total:', newCons.length)
  filewrite(newCons.map(c => ({ id: c.id, class: c.class, name: c.name })), 'new-constraints')

  return { partId }
}
