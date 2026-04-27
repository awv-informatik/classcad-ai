export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GeoIdsTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  console.log('[01] partId:', partId, 'boxId:', boxId)

  await api.v1.common.recalc({})

  // Box at origin: L=80(X), W=60(Y), H=40(Z)
  // Query edges at known positions (midpoints of edges)

  // Bottom front edge: Y=0, Z=0, midpoint X=40
  const r1 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 0] }],
  })
  console.log('[01] bottom-front edge:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)

  // Right edge: X=80, Y=30, Z=0
  const r2 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [80, 30, 0] }],
  })
  console.log('[01] right-bottom edge:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)

  // Top-front edge: Y=0, Z=40, midpoint X=40
  const r3 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 40] }],
  })
  console.log('[01] top-front edge:', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)

  // Vertical edge: X=0, Y=0, midpoint Z=20
  const r4 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [0, 0, 20] }],
  })
  console.log('[01] vertical-front-left edge:', JSON.stringify(r4.result), 'maxLevel:', r4.maxLevel)

  // Multiple edges in one call
  const r5 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [40, 0, 0] },   // bottom front
      { pos: [80, 30, 0] },  // right bottom
      { pos: [0, 0, 20] },   // vertical front-left
    ],
  })
  console.log('[01] multi-edge result:', JSON.stringify(r5.result), 'maxLevel:', r5.maxLevel)

  filewrite(r5, 'multi-edge-full-response')

  await snapshot('box-edges')
  return { partId, boxId }
}
