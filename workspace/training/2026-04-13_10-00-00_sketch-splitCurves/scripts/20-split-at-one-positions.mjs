// Test: Split at 1.0 — check positions to confirm degenerate segment
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitAt1Pos' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result

  const r = await api.v1.sketch.splitCurves({
    id: skId,
    splits: [{ geomId: lineId, values: [1.0] }]
  })
  console.log('[20] split at 1.0 — result:', JSON.stringify(r.result))
  for (const segId of r.result[0]) {
    const pos = await api.v1.sketch.getPositions({ id: segId })
    console.log(`[20] seg ${segId}: positions=${JSON.stringify(pos.result)}`)
  }

  return { partId }
}
