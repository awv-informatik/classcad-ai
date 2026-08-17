// Compare interpolationCurve vs bezierCurve with same control points
// interpolationCurve passes THROUGH points, bezierCurve approximates
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InterpVsBezier' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const points = [
    [0, 0, 0],
    [10, 30, 0],
    [30, 30, 0],
    [40, 0, 0],
  ]

  // Shape 1: interpolation curve
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Interp' })).result
  await api.v1.curve.interpolationCurve({ id: s1, points })

  // Shape 2: bezier curve with same points
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Bezier' })).result
  await api.v1.curve.bezierCurve({ id: s2, points })

  // Also add reference points as small indicators
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'Points' })).result
  for (const pt of points) {
    // Small cross at each point
    await api.v1.curve.line({ id: s3, startPos: [pt[0]-1, pt[1], 0], endPos: [pt[0]+1, pt[1], 0] })
    await api.v1.curve.line({ id: s3, startPos: [pt[0], pt[1]-1, 0], endPos: [pt[0], pt[1]+1, 0] })
  }

  await snapshot('interp-vs-bezier')
  return { partId }
}
