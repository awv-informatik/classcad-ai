// Test: Check naming convention of split segments
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Naming' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const line = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result
  console.log('[10] line:', line)

  // Split line at 2 positions
  const r = await api.v1.sketch.splitCurves({
    id: skId,
    splits: [{ geomId: line, values: [0.33, 0.66] }]
  })
  console.log('[10] result:', JSON.stringify(r.result))

  // Dump full structure for offline analysis
  filewrite(r.structure, 'structure-after-split')

  return { partId }
}
