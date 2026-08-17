// Test chordHeightTol and angleTol per-feature override
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FacetingTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result

  // Create a sphere — curvature makes faceting differences visible
  const sphId = (await api.v1.solid.sphere({ id: eifId, radius: 30 })).result
  console.log('[08] sphId:', sphId)

  // Get default faceting parameters for comparison
  const defaults = (await api.v1.common.getFacetingParameters({})).result
  console.log('[08] default faceting:', JSON.stringify(defaults))

  // Get baseline vertex count
  await api.v1.common.recalc({})
  const r0 = await api.v1.common.recalc({})
  const beforeVerts = r0.graphic?.mesh?.vertices?.length || 0
  console.log('[08] baseline vertex count:', beforeVerts)
  filewrite(r0.graphic?.mesh || { note: 'no mesh' }, 'graphic-baseline')

  await snapshot('baseline-sphere')

  // Set very coarse faceting on the feature
  const r1 = await api.v1.common.setAppearance({
    target: eifId,
    chordHeightTol: 5.0,
    angleTol: 45,
  })
  console.log('[08] coarse faceting result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'coarse-response')

  await api.v1.common.recalc({})
  const r2 = await api.v1.common.recalc({})
  const coarseVerts = r2.graphic?.mesh?.vertices?.length || 0
  console.log('[08] coarse vertex count:', coarseVerts)

  await snapshot('coarse-sphere')

  // Set very fine faceting on the feature
  const r3 = await api.v1.common.setAppearance({
    target: eifId,
    chordHeightTol: 0.01,
    angleTol: 1,
  })
  console.log('[08] fine faceting result:', r3.result, 'maxLevel:', r3.maxLevel)

  await api.v1.common.recalc({})
  const r4 = await api.v1.common.recalc({})
  const fineVerts = r4.graphic?.mesh?.vertices?.length || 0
  console.log('[08] fine vertex count:', fineVerts)

  await snapshot('fine-sphere')

  filewrite({ baseline: beforeVerts, coarse: coarseVerts, fine: fineVerts }, 'vertex-comparison')
  console.log('[08] Vert comparison — baseline:', beforeVerts, 'coarse:', coarseVerts, 'fine:', fineVerts)

  return { partId }
}
