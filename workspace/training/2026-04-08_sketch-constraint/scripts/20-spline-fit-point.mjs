// Test SPLINE_FIT_POINT constraint
// Spline creation not obvious — try sketch.geometry with different point formats
// Also try using sketch.geometry with 'splines' key
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Try 1: sketch.geometry with 'splines' key (undocumented?)
  const r1 = await api.v1.sketch.geometry({
    id: skId,
    splines: [{ points: [{ pos: [0, 0, 0] }, { pos: [20, 30, 0] }, { pos: [50, 20, 0] }, { pos: [80, 40, 0] }] }],
    genFixation: false,
  })
  console.log('[20] geometry-splines result:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)
  console.log('[20] geometry-splines messages:', JSON.stringify(r1.messages))

  // Try 2: sketch.geometry with 'type' param
  const r2 = await api.v1.sketch.geometry({
    id: skId,
    type: 'SPLINE',
    points: [{ pos: [0, 50, 0] }, { pos: [20, 80, 0] }, { pos: [50, 70, 0] }],
    genFixation: false,
  })
  console.log('[20] geometry-type-spline result:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)
  console.log('[20] geometry-type-spline messages:', JSON.stringify(r2.messages))

  filewrite({
    geometrySplines: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel },
    geometryTypeSpline: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel },
  }, 'spline-fit-point-response')

  await snapshot('spline-attempts')
  return { partId }
}
