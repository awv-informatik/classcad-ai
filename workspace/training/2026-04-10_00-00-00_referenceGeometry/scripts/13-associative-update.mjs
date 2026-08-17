// Test associative behavior: does reference geometry update when the underlying solid changes?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'AssocUpdate' })).result

  // Create a box
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  // Get top face and bottom-front edge
  const geo = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[40, 30, 40]] }],
    lines: [{ pos: [40, 0, 0] }]
  })
  const topFace = geo.result.planes[0]
  const edge = geo.result.lines[0]

  // Create sketch on top face, project bottom-front edge
  const skId = (await api.v1.sketch.create({ id: partId, name: 'AssocSketch', planeId: topFace })).result
  const refResult = await api.v1.sketch.referenceGeometry({ id: skId, brepIds: [edge] })
  const refLineId = refResult.result[0]

  // Record position BEFORE box update
  const posBefore = await api.v1.sketch.getPositions({ id: refLineId })
  console.log('[13] position before box update:', JSON.stringify(posBefore.result))

  // Now update the box length: 80 → 120
  await api.v1.part.openFeature({ id: boxId })
  await api.v1.part.updateBox({ id: boxId, length: 120 })
  await api.v1.part.closeFeature({ id: boxId })

  // Record position AFTER box update
  const posAfter = await api.v1.sketch.getPositions({ id: refLineId })
  console.log('[13] position after box update (length 80→120):', JSON.stringify(posAfter.result))

  filewrite({
    before: posBefore.result,
    after: posAfter.result,
    changed: JSON.stringify(posBefore.result) !== JSON.stringify(posAfter.result)
  }, 'associative-update')

  // Also test: create keepReference:FALSE line, does it update?
  const geo2 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [60, 60, 0] }]  // bottom-back edge (now at x up to 120)
  })
  const backEdge = geo2.result.lines[0]

  const noRefResult = await api.v1.sketch.referenceGeometry({ id: skId, brepIds: [backEdge], keepReference: 0 })
  const noRefLineId = noRefResult.result[0]
  const noRefPosBefore = await api.v1.sketch.getPositions({ id: noRefLineId })
  console.log('[13] noRef line position before update:', JSON.stringify(noRefPosBefore.result))

  // Update box width: 60 → 100
  await api.v1.part.openFeature({ id: boxId })
  await api.v1.part.updateBox({ id: boxId, width: 100 })
  await api.v1.part.closeFeature({ id: boxId })

  const noRefPosAfter = await api.v1.sketch.getPositions({ id: noRefLineId })
  console.log('[13] noRef line position after update (width 60→100):', JSON.stringify(noRefPosAfter.result))

  // Also check the referenced line (front edge) after this second update
  const refPosAfterWidth = await api.v1.sketch.getPositions({ id: refLineId })
  console.log('[13] ref line position after width update:', JSON.stringify(refPosAfterWidth.result))

  filewrite({
    noRefBefore: noRefPosBefore.result,
    noRefAfter: noRefPosAfter.result,
    noRefChanged: JSON.stringify(noRefPosBefore.result) !== JSON.stringify(noRefPosAfter.result),
    refAfterWidthUpdate: refPosAfterWidth.result
  }, 'noref-update')

  await snapshot('after-updates')
  return { partId }
}
