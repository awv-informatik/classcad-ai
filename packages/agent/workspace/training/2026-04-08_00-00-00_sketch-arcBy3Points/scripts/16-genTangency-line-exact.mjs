// Re-test genTangency with line — make sure the arc startPos exactly matches line endPos
// and the arc is truly tangent (leaves in the same direction as the line)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TanLine2' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Horizontal line
  const lineId = (await api.v1.sketch.line({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [40, 0, 0],
  })).result
  console.log('[16] lineId:', lineId)

  // Arc that starts at line endpoint and is tangent — line goes right (+x direction)
  // For tangency, arc at start must also go in +x direction
  // Arc on circle centered at (40, -20, 0) radius 20, starting at (40, 0, 0)
  // Tangent at (40,0,0) on this circle is (1,0,0) — horizontal, matches line direction!
  // midPos on this arc: at angle 45° → (40 + 20*sin(45), -20 + 20*cos(45)) ≈ (54.14, -5.86, 0)
  // endPos: at angle 90° → (60, -20, 0)
  const r = await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [40, 0, 0],
    midPos: [54.142, -5.858, 0],
    endPos: [60, -20, 0],
    genTangency: 1,
  })
  console.log('[16] arc:', r.result, 'maxLevel:', r.maxLevel)
  filewrite(r.structure, 'struct-tangent-line')

  await snapshot('tangent-to-line')
  return { partId }
}
