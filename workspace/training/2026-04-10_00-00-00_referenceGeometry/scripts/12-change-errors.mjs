// Test changeReferenceGeometry edge cases and unlinkReferenceGeometry then change
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ChangeErrors' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  const geo = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[40, 30, 40]] }],
    lines: [
      { pos: [40, 0, 0] },   // bottom-front
      { pos: [40, 60, 0] },  // bottom-back
      { pos: [0, 30, 0] },   // bottom-left
    ]
  })
  const topFace = geo.result.planes[0]
  const edge1 = geo.result.lines[0]
  const edge2 = geo.result.lines[1]
  const edge3 = geo.result.lines[2]

  const skId = (await api.v1.sketch.create({ id: partId, name: 'ChangeErrSketch', planeId: topFace })).result

  // Create a referenced line and an unreferenced (keepReference:FALSE) line
  const r1 = await api.v1.sketch.referenceGeometry({ id: skId, brepIds: [edge1] })
  const refLineId = r1.result[0]
  console.log('[12] referenced line:', refLineId)

  const r2 = await api.v1.sketch.referenceGeometry({ id: skId, brepIds: [edge2], keepReference: 0 })
  const unrefLineId = r2.result[0]
  console.log('[12] unreferenced line:', unrefLineId)

  // Test 1: changeReferenceGeometry on the referenced line (should work)
  const cr1 = await api.v1.sketch.changeReferenceGeometry({ id: skId, geomId: refLineId, refId: edge3 })
  console.log('[12] change referenced line — result:', cr1.result, 'maxLevel:', cr1.maxLevel)
  console.log('[12] change ref messages:', JSON.stringify(cr1.messages))
  filewrite({ result: cr1.result, messages: cr1.messages, maxLevel: cr1.maxLevel }, 'change-referenced')

  // Test 2: changeReferenceGeometry on the unreferenced line (keepReference was FALSE)
  const cr2 = await api.v1.sketch.changeReferenceGeometry({ id: skId, geomId: unrefLineId, refId: edge3 })
  console.log('[12] change unreferenced line — result:', cr2.result, 'maxLevel:', cr2.maxLevel)
  console.log('[12] change unref messages:', JSON.stringify(cr2.messages))
  filewrite({ result: cr2.result, messages: cr2.messages, maxLevel: cr2.maxLevel }, 'change-unreferenced')

  // Test 3: unlinkReferenceGeometry then changeReferenceGeometry
  // First create a fresh referenced line
  const r3 = await api.v1.sketch.referenceGeometry({ id: skId, brepIds: [edge1] })
  const line3 = r3.result[0]
  console.log('[12] fresh referenced line:', line3)

  // Unlink it
  const ur = await api.v1.sketch.unlinkReferenceGeometry({ id: skId, geomId: line3 })
  console.log('[12] unlink — maxLevel:', ur.maxLevel)

  // Try to change the now-unlinked line
  const cr3 = await api.v1.sketch.changeReferenceGeometry({ id: skId, geomId: line3, refId: edge2 })
  console.log('[12] change after unlink — result:', cr3.result, 'maxLevel:', cr3.maxLevel)
  console.log('[12] change-after-unlink messages:', JSON.stringify(cr3.messages))
  filewrite({ result: cr3.result, messages: cr3.messages, maxLevel: cr3.maxLevel }, 'change-after-unlink')

  // Test 4: unlinkReferenceGeometry on already-unlinked geometry
  const ur2 = await api.v1.sketch.unlinkReferenceGeometry({ id: skId, geomId: line3 })
  console.log('[12] unlink again (already unlinked) — result:', ur2.result, 'maxLevel:', ur2.maxLevel)
  console.log('[12] re-unlink messages:', JSON.stringify(ur2.messages))
  filewrite({ result: ur2.result, messages: ur2.messages, maxLevel: ur2.maxLevel }, 'unlink-twice')

  // Test 5: unlinkReferenceGeometry on a hand-drawn line (not from referenceGeometry)
  const handLine = (await api.v1.sketch.line({ id: skId, startPos: [10, 10, 40], endPos: [50, 30, 40] })).result
  console.log('[12] hand-drawn line:', handLine)
  const ur3 = await api.v1.sketch.unlinkReferenceGeometry({ id: skId, geomId: handLine })
  console.log('[12] unlink hand-drawn — result:', ur3.result, 'maxLevel:', ur3.maxLevel)
  console.log('[12] unlink hand-drawn messages:', JSON.stringify(ur3.messages))
  filewrite({ result: ur3.result, messages: ur3.messages, maxLevel: ur3.maxLevel }, 'unlink-hand-drawn')

  return { partId }
}
