// 00-smoke — connectivity + canonical splitCurve case (line 0..100 split at 0.25)
// Validates: worker reachable, part+planeId sketch setup, splitCurve happy path,
// structured return shape, and the SPATIAL claim that value 0.25 -> vertex at (25,0,0).
export default async function (api, { snapshot, filewrite }) {
  // 0) connectivity
  const ver = await api.v1.common.getAppVersion({})
  console.log('[00] getAppVersion maxLevel:', ver.maxLevel, 'result:', JSON.stringify(ver.result))

  // 1) part + solver-enabled sketch (Top work plane)
  const partR = await api.v1.part.create({ name: 'SplitSmoke' })
  const partId = partR.result
  const top = Object.values(partR.structure.tree).find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  console.log('[00] partId:', partId, 'TopPlaneId:', top && top.id)
  const skId = (await api.v1.sketch.create({ id: partId, planeId: top.id, name: 'S' })).result
  console.log('[00] skId:', skId)

  // 2) a line from (0,0,0) to (100,0,0)
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [100, 0, 0] })).result
  console.log('[00] lineId:', lineId)

  // 3) splitCurve at normalized 0.25
  const r = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: lineId, values: [0.25] }] })
  console.log('[00] splitCurve maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'splitCurve-response')
  console.log('[00] result:', JSON.stringify(r.result))

  // 4) spatial proof — read both segments' endpoints
  const entry = Array.isArray(r.result) ? r.result.find(e => e.sourceId === lineId) || r.result[0] : null
  const segs = entry ? entry.splittedCurves : []
  const positions = []
  for (const s of segs) {
    const pr = await api.v1.sketch.getPositions({ id: s.id })
    positions.push({ id: s.id, interval: s.interval, pos: pr.result })
    console.log('[00] seg', s.id, 'interval', JSON.stringify(s.interval), 'pos', JSON.stringify(pr.result))
  }
  filewrite({ lineId, entry, positions }, 'segment-positions')

  // 5) is the original line id still valid?
  const origPos = await api.v1.sketch.getPositions({ id: lineId })
  console.log('[00] original lineId getPositions maxLevel:', origPos.maxLevel, 'result:', JSON.stringify(origPos.result))

  // 6) what does the sketch contain now?
  const geo = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[00] getGeometry:', JSON.stringify(geo.result))

  await snapshot('after-split')
  return { partId, skId, lineId, segCount: segs.length }
}
