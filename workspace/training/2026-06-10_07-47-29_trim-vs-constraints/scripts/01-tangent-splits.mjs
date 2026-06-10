// Q1: does splitAllCurves split at TANGENT touches under an active solver?
//  A: circle-circle tangency (constrained, the fillet case)
//  B: line-circle tangency (docs claim: line splits, circle doesn't)
//  C: transversal two-circle overlap (control: 2 segments each)
// Bonus: dump a split CC_Arc node to find direction/angle members (needed for classification).
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TanSplit' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'S' })).result
  const ctr = async id => (await api.v1.sketch.getPoints({ id })).result.centerId

  // A: constrained circle-circle tangency
  const a1 = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 20 })).result
  const a2 = (await api.v1.sketch.circle({ id: skId, centerPos: [45, 8, 0], radius: 12 })).result
  await api.v1.sketch.constraint([
    { id: skId, type: 'FIXATION', geomIds: [await ctr(a1)] },
    { id: skId, type: 'TANGENT', geomIds: [a2, a1] },
  ])
  await api.v1.sketch.dimension([
    { id: skId, type: 'DIAMETER', geomIds: [a1], value: 40 },
    { id: skId, type: 'DIAMETER', geomIds: [a2], value: 24 },
  ])

  // B: line-circle tangency
  const b1 = (await api.v1.sketch.line({ id: skId, startPos: [140, 0, 0], endPos: [260, 0, 0] })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [b1] })
  const b2 = (await api.v1.sketch.circle({ id: skId, centerPos: [200, 22, 0], radius: 15 })).result
  await api.v1.sketch.constraint({ id: skId, type: 'TANGENT', geomIds: [b2, b1] })

  // C: transversal overlap control
  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [320, 0, 0], radius: 20 })).result
  const c2 = (await api.v1.sketch.circle({ id: skId, centerPos: [350, 0, 0], radius: 20 })).result
  await api.v1.sketch.constraint([
    { id: skId, type: 'FIXATION', geomIds: [await ctr(c1)] },
    { id: skId, type: 'FIXATION', geomIds: [await ctr(c2)] },
  ])

  const sp = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[01] splitAllCurves maxLevel:', sp.maxLevel, 'count:', sp.result?.length)
  const tree = sp.structure?.tree ?? {}
  const byId = {}
  for (const n of Object.values(tree)) if (n?.id != null) byId[n.id] = n
  const parents = { a1, a2, b1, b2, c1, c2 }
  const segs = {}
  for (const sid of sp.result ?? []) {
    const n = byId[sid]
    const label = n?.name ?? `id${sid}`
    // map back: original ids keep their id; segments are named {Orig}_partN
    const owner = Object.entries(parents).find(([, pid]) => pid === sid)?.[0]
      ?? Object.entries(parents).find(([k, pid]) => label.startsWith(byId[pid]?.name + '_part'))?.[0]
      ?? '??'
    segs[owner] = segs[owner] ?? []
    segs[owner].push(`${label}(${n?.class})`)
  }
  for (const [k, list] of Object.entries(segs)) console.log(`[01] ${k}: ${list.length} → ${list.join(', ')}`)

  // dump one split arc node for member inspection
  const arcSeg = (sp.result ?? []).map(i => byId[i]).find(n => n?.class === 'CC_Arc' || n?.name?.includes('_part'))
  filewrite({ arcSegNode: arcSeg, allSegs: segs }, 'segments')
  console.log('[01] sample segment members:', JSON.stringify(Object.keys(arcSeg?.members ?? {})))
  return {}
}
