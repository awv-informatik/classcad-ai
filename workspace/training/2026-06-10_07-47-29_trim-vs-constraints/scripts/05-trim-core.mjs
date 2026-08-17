// THE core question: trim + mergeBack on a constrained sketch.
// Constrained two-circle overlap (mixer hub scheme: D45x2, HD38, VD0) -> trim the lens arcs ->
// mergeBack -> do constraints/dimensions survive? does updateDimension still re-solve the
// TRIMMED profile? (ph's hypothesis: yes, stays constrained.)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TrimCore' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'S' })).result
  const ctr = async id => (await api.v1.sketch.getPoints({ id })).result.centerId

  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [40, 40, 0], radius: 20 })).result
  const c2 = (await api.v1.sketch.circle({ id: skId, centerPos: [70, 45, 0], radius: 18 })).result
  const p1 = await ctr(c1), p2 = await ctr(c2)
  await api.v1.sketch.constraint([{ id: skId, type: 'FIXATION', geomIds: [p1] }])
  const dims = (await api.v1.sketch.dimension([
    { id: skId, name: 'D1', type: 'DIAMETER', geomIds: [c1], value: 45 },
    { id: skId, name: 'D2', type: 'DIAMETER', geomIds: [c2], value: 45 },
    { id: skId, name: 'HD', type: 'HORIZONTAL_DISTANCE', geomIds: [p1, p2], value: 38 },
    { id: skId, name: 'VD', type: 'VERTICAL_DISTANCE', geomIds: [p1, p2], value: 0 },
  ])).result
  // solved: centers (40,40) & (78,40), r 22.5 — lens crossings at x=59, y=40±12.052
  await snapshot('05-before-trim')

  const sp = await api.v1.sketch.splitAllCurves({ id: skId })
  const tree = {}
  for (const n of Object.values(sp.structure?.tree ?? {})) if (n?.id != null) tree[n.id] = n
  const centers = { [c1]: [40, 40], [c2]: [78, 40] }
  const others = { [c1]: [78, 40], [c2]: [40, 40] }
  const toTrim = []
  for (const sid of sp.result ?? []) {
    const n = tree[sid]
    const orig = n?.members?.partOf?.value
    if (!centers[orig]) continue
    const iv = (n.members.interval?.members ?? []).map(m => m.value)
    let [a, b] = iv
    if (b < a) b += 2 * Math.PI
    const mid = (a + b) / 2
    const r = n.members.radius.value
    const mx = centers[orig][0] + r * Math.cos(mid), my = centers[orig][1] + r * Math.sin(mid)
    const inOther = Math.hypot(mx - others[orig][0], my - others[orig][1]) < 22.5 - 1e-6
    console.log(`[05] seg ${n.name} of ${orig}: interval [${a.toFixed(3)}, ${b.toFixed(3)}] mid(${mx.toFixed(2)}, ${my.toFixed(2)}) → ${inOther ? 'TRIM' : 'keep'}`)
    if (inOther) toTrim.push(sid)
  }
  console.log('[05] trimming', toTrim.length, 'of', sp.result?.length, 'segments (expect 2 of 4)')

  const tr = await api.v1.sketch.trimCurves({ id: skId, curveIds: toTrim })
  const mb = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[05] trim maxLevel:', tr.maxLevel, 'mergeBack maxLevel:', mb.maxLevel)
  await snapshot('05-after-trim')

  const geom = (await api.v1.sketch.getGeometry({ id: skId })).result
  console.log('[05] geometry after trim:', JSON.stringify(geom))
  const all = Object.values(mb.structure?.tree ?? {})
  const consA = all.filter(n => /Constraint/.test(n?.class ?? ''))
  const dimsA = all.filter(n => /FeatureDimension/.test(n?.class ?? ''))
  console.log('[05] constraints after:', consA.length, JSON.stringify(consA.map(n => `${n.name}:${n.members?.lgsState?.value}`)))
  console.log('[05] dims after:', dimsA.length, JSON.stringify(dimsA.map(n => `${n.name}=${n.id}:lgs${n.members?.lgsState?.value}`)))

  // does conditioning survive? find HD by name, drive 38 -> 50
  const hdNew = dimsA.find(n => n?.name === 'HD')?.id
  const u = await api.v1.sketch.updateDimension({ id: hdNew, value: 44 })
  console.log('[05] updateDimension HD→44 (id', hdNew + '): result', u.result, 'maxLevel', u.maxLevel, JSON.stringify(u.messages ?? []))

  // measure: arcs after re-solve — endpoints should sit at the NEW lens crossings x=... d=50:
  // crossing x from c1: (d^2 - r2^2 + r1^2)/(2d) with r1=r2=22.5 → x=40+25=65; y=40±sqrt(506.25-625)... negative → NO crossings at d=50! circles separate. pick 44 instead to keep overlap: y=40±sqrt(506.25-484)=40±4.717
  const arcsNow = (await api.v1.sketch.getGeometry({ id: skId })).result.arcs ?? []
  for (const aid of arcsNow) {
    const q = (await api.v1.sketch.getPositions({ id: aid })).result
    console.log(`[05] arc ${aid}:`, JSON.stringify(q))
  }
  await snapshot('05-after-redim')
  filewrite({ geom, cons: consA.length, dims: dimsA.map(n => n.name), upd: { r: u.result, m: u.maxLevel } }, 'trimcore')
  return {}
}
