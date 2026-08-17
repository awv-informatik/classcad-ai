// Test different degrees: linear (2 pts), quadratic (3 pts), quintic (6 pts)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DegreeTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Degrees' })).result

  // Linear (degree 1) - 2 points
  const r1 = await api.v1.curve.bezierCurve({
    id: shapeId,
    points: [[0, 0, 0], [40, 0, 0]],
  })
  console.log('[02] linear (2 pts): result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Quadratic (degree 2) - 3 points
  const r2 = await api.v1.curve.bezierCurve({
    id: shapeId,
    points: [[0, 20, 0], [20, 50, 0], [40, 20, 0]],
  })
  console.log('[02] quadratic (3 pts): result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Quintic (degree 5) - 6 points
  const r3 = await api.v1.curve.bezierCurve({
    id: shapeId,
    points: [
      [0, 50, 0], [8, 80, 0], [16, 50, 0],
      [24, 80, 0], [32, 50, 0], [40, 80, 0],
    ],
  })
  console.log('[02] quintic (6 pts): result:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    linear: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    quadratic: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    quintic: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'degree-results')

  await snapshot('degree-variants')
  return { partId }
}
