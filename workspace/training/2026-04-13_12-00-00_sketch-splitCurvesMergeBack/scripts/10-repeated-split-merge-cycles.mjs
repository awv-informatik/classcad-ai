// splitAllCurves → mergeBack → splitAllCurves → mergeBack (repeated cycles)
// Question: Can you repeatedly split and merge the same sketch?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RepeatedCycles' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const circleId = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-60, 0, 0], endPos: [60, 0, 0] })).result

  const geomStart = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[10] start geom:', JSON.stringify(geomStart.result))

  // Cycle 1: split → mergeBack (no trim)
  const split1 = (await api.v1.sketch.splitAllCurves({ id: skId })).result
  console.log('[10] cycle1 splitIds:', JSON.stringify(split1))
  await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  const geom1 = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[10] cycle1 geom after merge:', JSON.stringify(geom1.result))

  // Cycle 2: split → mergeBack (no trim)
  const split2 = (await api.v1.sketch.splitAllCurves({ id: skId })).result
  console.log('[10] cycle2 splitIds:', JSON.stringify(split2))
  await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  const geom2 = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[10] cycle2 geom after merge:', JSON.stringify(geom2.result))

  // Cycle 3: split → trim → mergeBack
  const split3 = (await api.v1.sketch.splitAllCurves({ id: skId })).result
  console.log('[10] cycle3 splitIds:', JSON.stringify(split3))
  // Trim upper arc
  await api.v1.sketch.trimCurves({ id: skId, curveIds: [split3[0]] })
  await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  const geom3 = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[10] cycle3 geom after trim+merge:', JSON.stringify(geom3.result))

  await snapshot('after-3-cycles')

  filewrite({
    start: geomStart.result,
    afterCycle1: geom1.result,
    afterCycle2: geom2.result,
    afterCycle3: geom3.result
  }, 'cycle-comparison')

  return { partId }
}
