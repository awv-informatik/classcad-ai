export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FacetTest' })).result
  const sph1 = (await api.v1.part.sphere({ id: partId, name: 'Sph1', radius: 30 })).result
  const sph2 = (await api.v1.part.sphere({ id: partId, name: 'Sph2', radius: 30, translation: [80, 0, 0] })).result

  console.log('[07] sph1:', sph1, 'sph2:', sph2)

  await snapshot('before-faceting')

  // Set coarse faceting on sph1 via part.setAppearance
  const r1 = await api.v1.part.setAppearance({ target: sph1, chordHeightTol: 5.0, angleTol: 45 })
  console.log('[07] coarse faceting:', r1.maxLevel)

  // Set fine faceting on sph2 via part.setAppearance
  const r2 = await api.v1.part.setAppearance({ target: sph2, chordHeightTol: 0.01, angleTol: 1 })
  console.log('[07] fine faceting:', r2.maxLevel)

  // Get structure to compare mesh data
  const struct = await api.v1.common.recalc({})
  console.log('[07] recalc maxLevel:', struct.maxLevel)

  await snapshot('after-faceting')

  // Dump graphic data for both spheres to compare triangle counts
  const g1 = await api.v1.common.requestVisualisation({ ids: [sph1] })
  const g2 = await api.v1.common.requestVisualisation({ ids: [sph2] })
  filewrite({ sph1Graphic: g1.graphic, sph2Graphic: g2.graphic }, 'faceting-graphic')

  // Also set both color AND faceting in one call
  const r3 = await api.v1.part.setAppearance({ target: sph1, color: [255, 0, 0], chordHeightTol: 3.0, angleTol: 30 })
  console.log('[07] color+faceting combo:', r3.maxLevel)

  await snapshot('color-and-faceting')

  filewrite({
    coarse: { maxLevel: r1.maxLevel, msgs: r1.messages },
    fine: { maxLevel: r2.maxLevel, msgs: r2.messages },
    combo: { maxLevel: r3.maxLevel, msgs: r3.messages },
  }, 'faceting-results')

  return { partId }
}
