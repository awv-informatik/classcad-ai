// Check if constraints survive the trim+mergeBack workflow
// Create geometry with auto-constraints, split, trim, merge, check constraints
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Constraints' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Draw L-shape with auto-constraints
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [50, 0, 0], endPos: [50, 30, 0] })).result
  // A crossing diagonal
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [0, -10, 0], endPos: [60, 40, 0] })).result
  console.log('[17] l1:', l1, 'l2:', l2, 'l3:', l3)

  // Check getGeometry before
  const geomBefore = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[17] geomBefore:', JSON.stringify(geomBefore.result))
  await snapshot('before')

  // Split
  const splitIds = (await api.v1.sketch.splitAllCurves({ id: skId })).result
  console.log('[17] splitIds:', JSON.stringify(splitIds), 'count:', splitIds.length)

  // Trim one segment of the diagonal
  if (splitIds.length > 3) {
    await api.v1.sketch.trimCurves({ id: skId, curveIds: [splitIds[splitIds.length - 2]] })
    console.log('[17] trimmed segment at index', splitIds.length - 2)
  }

  // mergeBack
  const mergeR = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[17] mergeBack maxLevel:', mergeR.maxLevel)

  const geomAfter = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[17] geomAfter:', JSON.stringify(geomAfter.result))
  filewrite(geomAfter.result, 'geometry-after')

  await snapshot('after')

  return { partId }
}
