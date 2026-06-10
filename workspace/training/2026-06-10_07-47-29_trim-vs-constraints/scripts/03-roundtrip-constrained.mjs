// Q3: split -> mergeBack WITHOUT trims on a constrained sketch: IDs preserved? constraints
// survive? and is the solver still LIVE afterward (updateDimension moves geometry)?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Roundtrip' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'S' })).result
  const ctr = async id => (await api.v1.sketch.getPoints({ id })).result.centerId

  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [40, 40, 0], radius: 20 })).result
  const c2 = (await api.v1.sketch.circle({ id: skId, centerPos: [70, 45, 0], radius: 18 })).result
  const p1 = await ctr(c1), p2 = await ctr(c2)
  await api.v1.sketch.constraint([{ id: skId, type: 'FIXATION', geomIds: [p1] }])
  const dims = (await api.v1.sketch.dimension([
    { id: skId, type: 'DIAMETER', geomIds: [c1], value: 45 },
    { id: skId, type: 'DIAMETER', geomIds: [c2], value: 45 },
    { id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [p1, p2], value: 38 },
    { id: skId, type: 'VERTICAL_DISTANCE', geomIds: [p1, p2], value: 0 },
  ])).result

  await api.v1.sketch.splitAllCurves({ id: skId })
  const mb = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[03] mergeBack (no trims) maxLevel:', mb.maxLevel)

  const geom = (await api.v1.sketch.getGeometry({ id: skId })).result
  console.log('[03] geometry after roundtrip:', JSON.stringify(geom), '— c1,c2 were', c1, c2)
  const sameIds = geom.circles?.includes(c1) && geom.circles?.includes(c2)
  console.log('[03] original circle IDs preserved:', sameIds)

  const all = Object.values(mb.structure?.tree ?? {})
  console.log('[03] constraint nodes:', all.filter(n => /Constraint/.test(n?.class ?? '')).length,
    'dimension nodes:', all.filter(n => /FeatureDimension/.test(n?.class ?? '')).length)

  // solver still live? change HD 38 -> 50
  const u = await api.v1.sketch.updateDimension({ id: dims[2], value: 50 })
  const c2pos = (await api.v1.sketch.getPositions({ id: p2 })).result.pos
  console.log('[03] updateDimension HD 38→50: result', u.result, '(1=solved) — c2 center:', JSON.stringify(c2pos), '(expect x=90)')

  filewrite({ sameIds, c2pos, updResult: u.result }, 'roundtrip')
  return {}
}
