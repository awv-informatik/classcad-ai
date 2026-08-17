export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PreRecalcTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  // Query BEFORE recalc
  const r1 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 0] }],
  })
  console.log('[08] pre-recalc edge:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)

  const r2 = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[40, 30, 40]] }],
  })
  console.log('[08] pre-recalc face:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)

  const r3 = await api.v1.part.getGeometryIds({
    id: partId,
    points: [{ pos: [0, 0, 0] }],
  })
  console.log('[08] pre-recalc vertex:', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)

  // Now recalc
  await api.v1.common.recalc({})

  // Query AFTER recalc
  const r4 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 0] }],
  })
  console.log('[08] post-recalc edge:', JSON.stringify(r4.result), 'maxLevel:', r4.maxLevel)

  const r5 = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[40, 30, 40]] }],
  })
  console.log('[08] post-recalc face:', JSON.stringify(r5.result), 'maxLevel:', r5.maxLevel)

  const r6 = await api.v1.part.getGeometryIds({
    id: partId,
    points: [{ pos: [0, 0, 0] }],
  })
  console.log('[08] post-recalc vertex:', JSON.stringify(r6.result), 'maxLevel:', r6.maxLevel)

  // Compare pre vs post
  const preEdge = r1.result?.lines?.[0]
  const postEdge = r4.result?.lines?.[0]
  const preFace = r2.result?.planes?.[0]
  const postFace = r5.result?.planes?.[0]
  const preVertex = r3.result?.points?.[0]
  const postVertex = r6.result?.points?.[0]

  console.log('[08] edge same?', preEdge === postEdge, '| face same?', preFace === postFace, '| vertex same?', preVertex === postVertex)
  filewrite({ preEdge, postEdge, preFace, postFace, preVertex, postVertex }, 'pre-vs-post-recalc')

  return { partId }
}
