// Test: visual comparison — snapshot sphere at different chordHeightTol values
// Using a fixed reference body (small box) to show relative quality difference
export default async function (api, { snapshot, filewrite }) {
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0 })

  // Coarse tessellation
  await api.v1.common.setFacetingParameters({ chordHeightTol: 5.0, angleTol: 0 })
  const partId1 = (await api.v1.part.create({ name: 'CoarseTest' })).result
  const eifId1 = (await api.v1.part.entityInjection({ id: partId1, name: 'EIF' })).result
  await api.v1.solid.sphere({ id: eifId1, radius: 20 })
  await api.v1.solid.box({ id: eifId1, length: 5, width: 5, height: 5, translation: [30, 0, 0] })
  await snapshot('coarse-cht5')

  // Fine tessellation
  await api.v1.common.setFacetingParameters({ chordHeightTol: 0.01, angleTol: 0 })
  const partId2 = (await api.v1.part.create({ name: 'FineTest' })).result
  const eifId2 = (await api.v1.part.entityInjection({ id: partId2, name: 'EIF' })).result
  await api.v1.solid.sphere({ id: eifId2, radius: 20 })
  await api.v1.solid.box({ id: eifId2, length: 5, width: 5, height: 5, translation: [30, 0, 0] })
  await snapshot('fine-cht001')

  console.log('[13] coarse (cht=5.0) and fine (cht=0.01) snapshots captured')
  return { done: true }
}
