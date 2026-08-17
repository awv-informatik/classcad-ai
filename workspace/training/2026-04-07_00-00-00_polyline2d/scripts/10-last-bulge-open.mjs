// Question: does the last bulge matter for an open polyline?
// The last point has no "next" point, so bulge should be ignored for open polylines
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LastBulge' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Test 1: last bulge = 0 (control)
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'LastB0' })).result
  const r1 = await api.v1.curve.polyline2d({
    id: s1,
    points: [
      [0, 0, 0],
      [30, 0, 0],
      [60, 0, 0],
    ],
    bulges: [0.5, 0, 0],
  })
  console.log('[10a] last bulge=0 (open):', r1.result, 'maxLevel:', r1.maxLevel)

  // Test 2: last bulge = 1 (should be ignored on open polyline)
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'LastB1' })).result
  const r2 = await api.v1.curve.polyline2d({
    id: s2,
    points: [
      [0, 40, 0],
      [30, 40, 0],
      [60, 40, 0],
    ],
    bulges: [0.5, 0, 1],
  })
  console.log('[10b] last bulge=1 (open):', r2.result, 'maxLevel:', r2.maxLevel)

  // Test 3: last bulge = 1 with close: true (SHOULD create arc from last to first)
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'LastBClosed' })).result
  const r3 = await api.v1.curve.polyline2d({
    id: s3,
    points: [
      [0, -40, 0],
      [30, -40, 0],
      [60, -40, 0],
    ],
    bulges: [0.5, 0, 1],
    close: true,
  })
  console.log('[10c] last bulge=1 (closed):', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite(
    {
      lastBulge0: { result: r1.result, maxLevel: r1.maxLevel },
      lastBulge1Open: { result: r2.result, maxLevel: r2.maxLevel },
      lastBulge1Closed: { result: r3.result, maxLevel: r3.maxLevel },
    },
    'last-bulge-response',
  )

  await snapshot('last-bulge-comparison')
  return { partId }
}
