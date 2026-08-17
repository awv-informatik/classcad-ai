// Q: why did updateDimension fail (null) after a no-trim roundtrip in 03?
// Hypothesis: mergeBack recreates dimension/constraint NODES with new IDs — old handles dangle.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Handles' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'S' })).result
  const ctr = async id => (await api.v1.sketch.getPoints({ id })).result.centerId

  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [40, 40, 0], radius: 20 })).result
  const c2 = (await api.v1.sketch.circle({ id: skId, centerPos: [70, 45, 0], radius: 18 })).result
  const p1 = await ctr(c1), p2 = await ctr(c2)
  await api.v1.sketch.constraint([{ id: skId, type: 'FIXATION', geomIds: [p1] }])
  const dimsR = await api.v1.sketch.dimension([
    { id: skId, name: 'D1', type: 'DIAMETER', geomIds: [c1], value: 45 },
    { id: skId, name: 'D2', type: 'DIAMETER', geomIds: [c2], value: 45 },
    { id: skId, name: 'HD', type: 'HORIZONTAL_DISTANCE', geomIds: [p1, p2], value: 38 },
    { id: skId, name: 'VD', type: 'VERTICAL_DISTANCE', geomIds: [p1, p2], value: 0 },
  ])
  const dimNodes = r => Object.values(r.structure?.tree ?? {})
    .filter(n => /FeatureDimension/.test(n?.class ?? ''))
    .map(n => `${n.name}=${n.id}`).sort()
  const conNodes = r => Object.values(r.structure?.tree ?? {})
    .filter(n => /Constraint/.test(n?.class ?? ''))
    .map(n => `${n.name}=${n.id}`).sort()
  console.log('[04] dims before:', JSON.stringify(dimNodes(dimsR)), 'ids returned:', JSON.stringify(dimsR.result))
  console.log('[04] cons before:', JSON.stringify(conNodes(dimsR)))

  await api.v1.sketch.splitAllCurves({ id: skId })
  const mb = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[04] dims after :', JSON.stringify(dimNodes(mb)))
  console.log('[04] cons after :', JSON.stringify(conNodes(mb)))

  // try old handle
  const hdOld = dimsR.result[2]
  const u1 = await api.v1.sketch.updateDimension({ id: hdOld, value: 50 })
  console.log('[04] update OLD id', hdOld, '→ result:', u1.result, 'maxLevel:', u1.maxLevel, JSON.stringify(u1.messages ?? []))

  // find new handle by name and retry
  const hdNew = Object.values(mb.structure?.tree ?? {}).find(n => /FeatureDimension/.test(n?.class ?? '') && n?.name === 'HD')?.id
  console.log('[04] HD node id after roundtrip:', hdNew, '(was', hdOld + ')')
  const u2 = await api.v1.sketch.updateDimension({ id: hdNew, value: 50 })
  const c2pos = (await api.v1.sketch.getPositions({ id: p2 })).result?.pos
  console.log('[04] update NEW id → result:', u2.result, 'maxLevel:', u2.maxLevel, '— c2:', JSON.stringify(c2pos), '(expect x=90)')

  filewrite({ before: dimNodes(dimsR), after: dimNodes(mb), u1: { r: u1.result, m: u1.maxLevel }, u2: { r: u2.result, m: u2.maxLevel }, c2pos }, 'handles')
  return {}
}
