// Visual test: two spheres side by side, one fine one coarse, in per-entity mode.
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'PerEntityVisual' })).result
  const eif1 = (await api.v1.part.entityInjection({ id: partId, name: 'Fine' })).result
  const eif2 = (await api.v1.part.entityInjection({ id: partId, name: 'Coarse' })).result

  const sph1 = (await api.v1.solid.sphere({ id: eif1, radius: 20 })).result
  const sph2 = (await api.v1.solid.sphere({ id: eif2, radius: 20, translation: [60, 0, 0] })).result

  // Set per-entity tessellation via setAppearance
  await api.v1.common.setAppearance({ target: eif1, chordHeightTol: 0.01 })
  await api.v1.common.setAppearance({ target: eif2, chordHeightTol: 5 })

  // mode=1 for per-entity
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 1 })
  await snapshot('per-entity-mode1')

  // mode=0 for global — both should look the same
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0, chordHeightTol: 0.1 })
  await snapshot('global-mode0')

  // Reset
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.1, angleTol: 0, facetingParamsMode: 1 })
  return { partId }
}
