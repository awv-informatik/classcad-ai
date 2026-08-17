// Correct classification (interval = 0..1 FRACTION of full circle; direction validated per
// segment from world endpoints) → trim BOTH lens arcs → inspect Auto_Coinc wiring →
// then re-dimension a DIAMETER on a trimmed arc: does the profile re-solve coherently?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Classify' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'S' })).result
  const ctr = async id => (await api.v1.sketch.getPoints({ id })).result.centerId

  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [40, 40, 0], radius: 20 })).result
  const c2 = (await api.v1.sketch.circle({ id: skId, centerPos: [70, 45, 0], radius: 18 })).result
  const p1 = await ctr(c1), p2 = await ctr(c2)
  await api.v1.sketch.constraint([{ id: skId, type: 'FIXATION', geomIds: [p1] }])
  await api.v1.sketch.dimension([
    { id: skId, name: 'D1', type: 'DIAMETER', geomIds: [c1], value: 45 },
    { id: skId, name: 'D2', type: 'DIAMETER', geomIds: [c2], value: 45 },
    { id: skId, name: 'HD', type: 'HORIZONTAL_DISTANCE', geomIds: [p1, p2], value: 38 },
    { id: skId, name: 'VD', type: 'VERTICAL_DISTANCE', geomIds: [p1, p2], value: 0 },
  ])

  const sp = await api.v1.sketch.splitAllCurves({ id: skId })
  const tree = {}
  for (const n of Object.values(sp.structure?.tree ?? {})) if (n?.id != null) tree[n.id] = n

  // robust arc-segment midpoint: world endpoints + fraction width decide direction
  const segMid = async (sid) => {
    const n = tree[sid]
    const [t0, t1raw] = (n.members.interval?.members ?? []).map(m => m.value)
    const w = (t1raw < t0 ? t1raw + 1 : t1raw) - t0
    const q = (await api.v1.sketch.getPositions({ id: sid })).result
    if (!q?.centerPos) return null // lines etc.
    const th = p => Math.atan2(p.y - q.centerPos.y, p.x - q.centerPos.x)
    const r = n.members.radius.value
    const ts = th(q.startPos), te = th(q.endPos)
    const norm = a => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    const dCCW = norm(te - ts)
    // tolerance-free: pick the direction whose span FRACTION is closer to the interval width w
    const ccwErr = Math.abs(dCCW / (2 * Math.PI) - w)
    const cwErr = Math.abs((2 * Math.PI - dCCW) / (2 * Math.PI) - w)
    const dir = ccwErr <= cwErr ? 1 : -1
    const mid = dir === 1 ? ts + dCCW / 2 : ts - (2 * Math.PI - dCCW) / 2
    return { x: q.centerPos.x + r * Math.cos(mid), y: q.centerPos.y + r * Math.sin(mid), w, dir, posWorks: true }
  }

  const centers = { [c1]: [40, 40], [c2]: [78, 40] }
  const others = { [c1]: [78, 40], [c2]: [40, 40] }
  const toTrim = []
  for (const sid of sp.result ?? []) {
    const n = tree[sid]
    const orig = n?.members?.partOf?.value
    if (!centers[orig]) continue
    const m = await segMid(sid)
    const inOther = m && Math.hypot(m.x - others[orig][0], m.y - others[orig][1]) < 22.5 - 1e-6
    console.log(`[06] ${n.name} (of ${orig}) w=${m?.w.toFixed(3)} dir=${m?.dir} mid(${m?.x.toFixed(2)}, ${m?.y.toFixed(2)}) → ${inOther ? 'TRIM' : 'keep'}`)
    if (inOther) toTrim.push(sid)
  }
  console.log('[06] trimming', toTrim.length, '(expect 2: both lens arcs)')
  await api.v1.sketch.trimCurves({ id: skId, curveIds: toTrim })
  const mb = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  await snapshot('06-after-trim')

  const geom = (await api.v1.sketch.getGeometry({ id: skId })).result
  console.log('[06] geometry:', JSON.stringify(geom), '(expect 2 arcs, 0 circles)')
  const all = Object.values(mb.structure?.tree ?? {})
  const autos = all.filter(n => n?.name?.startsWith?.('Auto_Coinc'))
  console.log('[06] Auto_Coinc count:', autos.length)
  filewrite(autos, 'auto-coincs')

  // re-dimension DIAMETER on trimmed arc: D1 45→52. Expected with HD=38, r1=26, r2=22.5:
  // crossings x=40+21.233=61.23, y=40±15.005
  const dimsA = all.filter(n => /FeatureDimension/.test(n?.class ?? ''))
  const d1New = dimsA.find(n => n?.name === 'D1')?.id
  const u = await api.v1.sketch.updateDimension({ id: d1New, value: 52 })
  console.log('[06] updateDimension D1→52 on TRIMMED arc: result', u.result, 'maxLevel', u.maxLevel)
  for (const aid of (await api.v1.sketch.getGeometry({ id: skId })).result.arcs ?? []) {
    const q = (await api.v1.sketch.getPositions({ id: aid })).result
    console.log(`[06] arc ${aid}: start(${q.startPos.x.toFixed(3)}, ${q.startPos.y.toFixed(3)}) end(${q.endPos.x.toFixed(3)}, ${q.endPos.y.toFixed(3)}) center(${q.centerPos.x.toFixed(2)}, ${q.centerPos.y.toFixed(2)})`)
  }
  console.log('[06] expected joints: (61.234, 25.0) / (61.234, 55.0) approx — y=40±15.005')
  await snapshot('06-after-redim')
  return {}
}
