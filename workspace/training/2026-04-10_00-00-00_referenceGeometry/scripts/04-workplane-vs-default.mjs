// Test referenceGeometry — sketch on work plane vs default XY plane
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RefGeoWP' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  // Get a bottom edge
  const geoIds = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 0] }]  // bottom-front edge
  })
  const edgeId = geoIds.result.lines[0]
  console.log('[04] edgeId:', edgeId)

  // Test 1: Sketch on explicit work plane (create one at z=20)
  const wpId = (await api.v1.part.workPlane({
    id: partId, name: 'MidPlane',
    origin: [0, 0, 20], normal: [0, 0, 1], xDirection: [1, 0, 0]
  })).result
  console.log('[04] wpId:', wpId)

  const sk1 = (await api.v1.sketch.create({ id: partId, name: 'WPSketch', planeId: wpId })).result
  console.log('[04] sketch on WP id:', sk1)

  const r1 = await api.v1.sketch.referenceGeometry({ id: sk1, brepIds: [edgeId] })
  console.log('[04] refGeo on WP sketch — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[04] refGeo on WP sketch — messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'refgeo-wp')

  // Test 2: Sketch on default XY plane (no planeId)
  const sk2 = (await api.v1.sketch.create({ id: partId, name: 'DefaultSketch' })).result
  console.log('[04] sketch on default plane id:', sk2)

  // Re-get edge ID (may have changed)
  const geoIds2 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 0] }]
  })
  const edgeId2 = geoIds2.result.lines[0]
  console.log('[04] edgeId2 (re-fetched):', edgeId2)

  const r2 = await api.v1.sketch.referenceGeometry({ id: sk2, brepIds: [edgeId2] })
  console.log('[04] refGeo on default sketch — result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[04] refGeo on default sketch — messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'refgeo-default')

  // Test 3: Use setReferences to attach the default sketch to a work plane, then retry
  const sk3 = (await api.v1.sketch.create({ id: partId, name: 'SetRefSketch' })).result
  console.log('[04] sk3 (for setReferences):', sk3)

  const sr = await api.v1.sketch.setReferences({ id: sk3, planeId: wpId })
  console.log('[04] setReferences result:', sr.result, 'maxLevel:', sr.maxLevel, 'messages:', JSON.stringify(sr.messages))
  filewrite({ result: sr.result, messages: sr.messages, maxLevel: sr.maxLevel }, 'setReferences')

  // Re-get edge ID again
  const geoIds3 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 0] }]
  })
  const edgeId3 = geoIds3.result.lines[0]
  console.log('[04] edgeId3 (re-fetched):', edgeId3)

  const r3 = await api.v1.sketch.referenceGeometry({ id: sk3, brepIds: [edgeId3] })
  console.log('[04] refGeo on setRef sketch — result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[04] refGeo on setRef sketch — messages:', JSON.stringify(r3.messages))
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'refgeo-setref')

  return { partId }
}
