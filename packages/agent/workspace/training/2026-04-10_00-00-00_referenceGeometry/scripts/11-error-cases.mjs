// Test error cases: invalid IDs, empty brepIds, duplicate brep elements
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ErrorTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  const geo = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[40, 30, 40]] }],
    lines: [{ pos: [40, 0, 0] }]
  })
  const topFaceId = geo.result.planes[0]
  const edgeId = geo.result.lines[0]

  const skId = (await api.v1.sketch.create({ id: partId, name: 'ErrorSketch', planeId: topFaceId })).result

  // Test 1: Empty brepIds array
  const r1 = await api.v1.sketch.referenceGeometry({ id: skId, brepIds: [] })
  console.log('[11] empty brepIds — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[11] empty messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'empty-brepIds')

  // Test 2: Invalid brep ID
  const r2 = await api.v1.sketch.referenceGeometry({ id: skId, brepIds: [99999] })
  console.log('[11] invalid brepId — result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[11] invalid messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'invalid-brepId')

  // Test 3: Sketch ID instead of brep ID
  const r3 = await api.v1.sketch.referenceGeometry({ id: skId, brepIds: [skId] })
  console.log('[11] sketch as brepId — result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[11] sketch-as-brep messages:', JSON.stringify(r3.messages))
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'sketch-as-brepId')

  // Test 4: Same edge projected twice
  const r4a = await api.v1.sketch.referenceGeometry({ id: skId, brepIds: [edgeId] })
  console.log('[11] first projection — result:', r4a.result, 'maxLevel:', r4a.maxLevel)
  const r4b = await api.v1.sketch.referenceGeometry({ id: skId, brepIds: [edgeId] })
  console.log('[11] second projection (same edge) — result:', r4b.result, 'maxLevel:', r4b.maxLevel)
  console.log('[11] second projection messages:', JSON.stringify(r4b.messages))
  filewrite({ first: { result: r4a.result, maxLevel: r4a.maxLevel }, second: { result: r4b.result, messages: r4b.messages, maxLevel: r4b.maxLevel } }, 'duplicate-projection')

  // Test 5: Duplicate edges in same call
  const r5 = await api.v1.sketch.referenceGeometry({ id: skId, brepIds: [edgeId, edgeId] })
  console.log('[11] duplicate in same call — result:', r5.result, 'maxLevel:', r5.maxLevel)
  console.log('[11] duplicate messages:', JSON.stringify(r5.messages))
  filewrite({ result: r5.result, messages: r5.messages, maxLevel: r5.maxLevel }, 'duplicate-same-call')

  // Final sketch geometry count
  const skGeo = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[11] final sketch geometry:', JSON.stringify(skGeo.result))
  filewrite(skGeo.result, 'final-geometry')

  return { partId }
}
