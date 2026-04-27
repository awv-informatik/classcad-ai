export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VertexTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Box: L=80(X), W=60(Y), H=40(Z)
  // 8 vertices at corners

  // Origin vertex
  const r1 = await api.v1.part.getGeometryIds({
    id: partId,
    points: [{ pos: [0, 0, 0] }],
  })
  console.log('[03] origin vertex:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)

  // Opposite corner
  const r2 = await api.v1.part.getGeometryIds({
    id: partId,
    points: [{ pos: [80, 60, 40] }],
  })
  console.log('[03] far corner vertex:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)

  // All 8 vertices at once
  const r3 = await api.v1.part.getGeometryIds({
    id: partId,
    points: [
      { pos: [0, 0, 0] },
      { pos: [80, 0, 0] },
      { pos: [0, 60, 0] },
      { pos: [80, 60, 0] },
      { pos: [0, 0, 40] },
      { pos: [80, 0, 40] },
      { pos: [0, 60, 40] },
      { pos: [80, 60, 40] },
    ],
  })
  console.log('[03] all 8 vertices:', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)
  filewrite(r3, 'all-vertices-response')

  return { partId }
}
