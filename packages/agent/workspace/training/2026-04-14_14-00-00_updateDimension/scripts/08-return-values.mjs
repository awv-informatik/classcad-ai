// Study the return value of updateDimension more carefully
// We've seen 0 and 2 — what do they mean? Is 1 also possible?
// Also check: does it work without open/close feature editing?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'ReturnVals' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result

  // Fix start point
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts.startId] })

  // Dimension with auto-value (should lock at 80)
  const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [lineId] })).result

  // Test 1: update to same value (no change needed)
  const u1 = await api.v1.sketch.updateDimension({ id: dimId, value: 80 })
  console.log('[08] same value: result:', u1.result, 'maxLevel:', u1.maxLevel)

  // Test 2: update to different value
  const u2 = await api.v1.sketch.updateDimension({ id: dimId, value: 100 })
  console.log('[08] diff value: result:', u2.result, 'maxLevel:', u2.maxLevel)

  // Test 3: can we inspect the structure to see what result=0 vs result=2 maps to?
  // The lgsState in the sketch structure should tell us solver state
  const getSketchLgs = (structure) => {
    const tree = structure.tree
    for (const [id, node] of Object.entries(tree)) {
      if (node.class === 'CC_Sketch') {
        return node.members?.lgsState?.value
      }
    }
    return null
  }

  // Fully constrained sketch
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts.endId] })
  const u3 = await api.v1.sketch.updateDimension({ id: dimId, value: 120 })
  // Now both endpoints are fixed + dimension says 120 — conflict!
  console.log('[08] over-constrained: result:', u3.result, 'maxLevel:', u3.maxLevel)
  const lgs3 = getSketchLgs(u3.structure)
  console.log('[08] lgsState after over-constrain:', lgs3)

  // Check positions
  const pos3 = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[08] positions after over-constrain:', JSON.stringify(pos3))

  filewrite({
    sameValue: { result: u1.result, maxLevel: u1.maxLevel },
    diffValue: { result: u2.result, maxLevel: u2.maxLevel },
    overConstrained: { result: u3.result, maxLevel: u3.maxLevel, lgsState: lgs3, positions: pos3 },
  }, 'return-values-data')

  return { partId }
}
