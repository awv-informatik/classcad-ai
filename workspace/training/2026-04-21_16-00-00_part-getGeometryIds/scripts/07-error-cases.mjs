export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ErrorTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Position that doesn't match any geometry (floating in space)
  const r1 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [500, 500, 500] }],
  })
  console.log('[07] far-off position:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[07] messages:', JSON.stringify(r1.messages))

  // Position very close to an edge but not exact (tolerance test)
  // Bottom-front edge midpoint is at [40, 0, 0]
  const r2 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40.001, 0.001, 0.001] }],
  })
  console.log('[07] near-edge (0.001 off):', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)

  const r3 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40.1, 0.1, 0.1] }],
  })
  console.log('[07] near-edge (0.1 off):', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)

  const r4 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [41, 1, 1] }],
  })
  console.log('[07] near-edge (1.0 off):', JSON.stringify(r4.result), 'maxLevel:', r4.maxLevel)

  const r5 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [45, 5, 5] }],
  })
  console.log('[07] near-edge (5.0 off):', JSON.stringify(r5.result), 'maxLevel:', r5.maxLevel)

  // Wrong type: query a face position as an edge
  const r6 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 30, 40] }],  // center of top face, not an edge
  })
  console.log('[07] face-center as line:', JSON.stringify(r6.result), 'maxLevel:', r6.maxLevel)

  // Point on an edge but querying as a plane
  const r7 = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[40, 0, 0]] }],  // midpoint of bottom-front edge
  })
  console.log('[07] edge-pos as plane:', JSON.stringify(r7.result), 'maxLevel:', r7.maxLevel)

  filewrite({ farOff: r1, near001: r2, near01: r3, near1: r4, near5: r5, faceAsLine: r6, edgeAsPlane: r7 }, 'error-cases')

  return { partId }
}
