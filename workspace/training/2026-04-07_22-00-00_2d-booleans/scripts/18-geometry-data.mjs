// 18 — Verify boolean result with data: compare graphic/structure before vs after
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Two overlapping rectangles
  const s1 = (await api.v1.curve.shape({ id: eifId })).result
  await api.v1.curve.polyline2d({
    id: s1,
    points: [[0, 0, 0], [60, 0, 0], [60, 40, 0], [0, 40, 0]],
    close: true,
  })

  const s2 = (await api.v1.curve.shape({ id: eifId })).result
  const r2 = await api.v1.curve.polyline2d({
    id: s2,
    points: [[30, 20, 0], [90, 20, 0], [90, 60, 0], [30, 60, 0]],
    close: true,
  })

  // Capture structure before boolean
  const eifNodeBefore = r2.structure?.tree?.[String(eifId)]
  const s1Before = r2.structure?.tree?.[String(s1)]
  const s2Before = r2.structure?.tree?.[String(s2)]
  filewrite({
    eifChildren: eifNodeBefore?.children,
    s1: { geoIds: s1Before?.geometryIdList, name: s1Before?.name },
    s2: { geoIds: s2Before?.geometryIdList, name: s2Before?.name },
  }, 'before-union')

  // Capture graphic data before
  if (r2.graphic) {
    const edgesBefore = r2.graphic.edges
    console.log('[18] graphic edges count before:', edgesBefore?.length)
    filewrite(r2.graphic, 'graphic-before')
  }

  // Do union
  const rU = await api.v1.curve.union2d({ target: s1, tool: s2 })
  console.log('[18] union maxLevel:', rU.maxLevel)

  // Capture structure after
  const eifNodeAfter = rU.structure?.tree?.[String(eifId)]
  const s1After = rU.structure?.tree?.[String(s1)]
  const s2After = rU.structure?.tree?.[String(s2)]
  filewrite({
    eifChildren: eifNodeAfter?.children,
    s1: { geoIds: s1After?.geometryIdList, name: s1After?.name },
    s2Exists: !!s2After,
  }, 'after-union')

  // Capture graphic data after
  if (rU.graphic) {
    const edgesAfter = rU.graphic.edges
    console.log('[18] graphic edges count after:', edgesAfter?.length)
    filewrite(rU.graphic, 'graphic-after')
  }

  // Do the same for subtraction
  const eif2 = (await api.v1.part.entityInjection({ id: partId })).result
  const s3 = (await api.v1.curve.shape({ id: eif2 })).result
  await api.v1.curve.polyline2d({
    id: s3,
    points: [[0, 0, 0], [60, 0, 0], [60, 40, 0], [0, 40, 0]],
    close: true,
  })
  const s4 = (await api.v1.curve.shape({ id: eif2 })).result
  await api.v1.curve.circle({ id: s4, centerPos: [40, 20, 0], radius: 15 })

  const rS = await api.v1.curve.subtraction2d({ target: s3, tool: s4 })
  console.log('[18] subtraction maxLevel:', rS.maxLevel)

  const s3After = rS.structure?.tree?.[String(s3)]
  console.log('[18] s3 geoIds after sub:', s3After?.geometryIdList)

  await snapshot('after-subtraction-data')

  return { partId }
}
