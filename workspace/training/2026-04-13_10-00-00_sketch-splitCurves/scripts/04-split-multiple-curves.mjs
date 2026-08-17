// Test: Split multiple curves in one call
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiCurveSplit' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [0, -50, 0], endPos: [0, 50, 0] })).result
  console.log('[04] line1:', line1, 'line2:', line2)

  // Split both lines — line1 at 0.5, line2 at 0.33 and 0.66
  const r = await api.v1.sketch.splitCurves({
    id: skId,
    splits: [
      { geomId: line1, values: [0.5] },
      { geomId: line2, values: [0.33, 0.66] }
    ]
  })

  console.log('[04] result:', JSON.stringify(r.result))
  console.log('[04] maxLevel:', r.maxLevel)
  console.log('[04] outer length:', r.result?.length)
  if (r.result) {
    r.result.forEach((arr, i) => console.log(`[04] splits[${i}] length:`, arr?.length))
  }
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'multi-curve-response')

  await snapshot('multi-curve-split')
  return { partId }
}
