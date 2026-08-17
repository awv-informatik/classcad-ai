// Edge cases: (a) constraint whose partner curve gets FULLY trimmed away — dangling behavior?
// (b) updateDimension DURING the staged state (between split and mergeBack) — legal? corrupting?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Edge' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  // (a) dangling partner: line TANGENT to circle; trim the whole circle away
  const skA = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'A' })).result
  const l1 = (await api.v1.sketch.line({ id: skA, startPos: [0, 0, 0], endPos: [100, 0, 0] })).result
  await api.v1.sketch.constraint({ id: skA, type: 'FIXATION', geomIds: [l1] })
  const cA = (await api.v1.sketch.circle({ id: skA, centerPos: [50, 30, 0], radius: 15 })).result
  const tg = await api.v1.sketch.constraint({ id: skA, type: 'TANGENT', geomIds: [cA, l1] })
  const sp1 = await api.v1.sketch.splitAllCurves({ id: skA })
  const tree1 = {}
  for (const n of Object.values(sp1.structure?.tree ?? {})) if (n?.id != null) tree1[n.id] = n
  const circleSegs = (sp1.result ?? []).filter(sid => tree1[sid]?.members?.partOf?.value === cA || sid === cA)
  console.log('[07a] circle segs to remove:', JSON.stringify(circleSegs.map(s => tree1[s]?.name ?? s)))
  await api.v1.sketch.trimCurves({ id: skA, curveIds: circleSegs })
  const mb1 = await api.v1.sketch.splitCurvesMergeBack({ id: skA })
  const geomA = (await api.v1.sketch.getGeometry({ id: skA })).result
  console.log('[07a] mergeBack maxLevel:', mb1.maxLevel, 'geometry:', JSON.stringify(geomA))
  const consA = Object.values(mb1.structure?.tree ?? {}).filter(n => /Constraint/.test(n?.class ?? ''))
  console.log('[07a] constraints after circle fully trimmed:', JSON.stringify(consA.map(n => `${n.name}:lgs${n.members?.lgsState?.value}`)))
  // is the sketch still healthy? move-test: line still fixed, add a new circle + tangent
  const cB = (await api.v1.sketch.circle({ id: skA, centerPos: [30, 20, 0], radius: 10 })).result
  const tg2 = await api.v1.sketch.constraint({ id: skA, type: 'TANGENT', geomIds: [cB, l1] })
  const cBpos = (await api.v1.sketch.getPositions({ id: (await api.v1.sketch.getPoints({ id: cB })).result.centerId })).result.pos
  console.log('[07a] post-trim sketch still solving: new tangent →', JSON.stringify(cBpos), '(expect y=10)')

  // (b) updateDimension while STAGED
  const skB = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'B' })).result
  const d1 = (await api.v1.sketch.circle({ id: skB, centerPos: [40, 40, 0], radius: 20 })).result
  const d2 = (await api.v1.sketch.circle({ id: skB, centerPos: [70, 45, 0], radius: 18 })).result
  const q1 = (await api.v1.sketch.getPoints({ id: d1 })).result.centerId
  const q2 = (await api.v1.sketch.getPoints({ id: d2 })).result.centerId
  await api.v1.sketch.constraint([{ id: skB, type: 'FIXATION', geomIds: [q1] }])
  const dims = (await api.v1.sketch.dimension([
    { id: skB, name: 'DD1', type: 'DIAMETER', geomIds: [d1], value: 45 },
    { id: skB, name: 'HDx', type: 'HORIZONTAL_DISTANCE', geomIds: [q1, q2], value: 38 },
    { id: skB, name: 'VDx', type: 'VERTICAL_DISTANCE', geomIds: [q1, q2], value: 0 },
  ])).result
  const spB = await api.v1.sketch.splitAllCurves({ id: skB })
  console.log('[07b] staged segments:', spB.result?.length)
  const uStaged = await api.v1.sketch.updateDimension({ id: dims[1], value: 44 })
  console.log('[07b] updateDimension WHILE staged: result', uStaged.result, 'maxLevel', uStaged.maxLevel, JSON.stringify(uStaged.messages ?? []))
  const c2staged = (await api.v1.sketch.getPositions({ id: q2 })).result?.pos
  console.log('[07b] c2 center during staged after update:', JSON.stringify(c2staged))
  const mbB = await api.v1.sketch.splitCurvesMergeBack({ id: skB })
  const geomB = (await api.v1.sketch.getGeometry({ id: skB })).result
  console.log('[07b] mergeBack after staged-update maxLevel:', mbB.maxLevel, 'geometry:', JSON.stringify(geomB))
  const c2after = (await api.v1.sketch.getPositions({ id: q2 })).result?.pos
  console.log('[07b] c2 center after mergeBack:', JSON.stringify(c2after), '— sketch consistent?')

  filewrite({ consA: consA.map(n => n.name), cBpos, uStaged: { r: uStaged.result, m: uStaged.maxLevel }, c2staged, c2after }, 'edge')
  return {}
}
