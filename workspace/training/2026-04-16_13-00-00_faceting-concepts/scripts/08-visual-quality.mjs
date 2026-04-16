// Visual comparison: snapshot a sphere at different tessellation qualities.
// Shows what coarse vs fine actually looks like.
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'VisualQuality' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const sphId = (await api.v1.solid.sphere({ id: eifId, radius: 20 })).result

  // Very coarse
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 5, angleTol: 0, facetingParamsMode: 0 })
  await snapshot('coarse-cht5')

  // Medium
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.5, angleTol: 0 })
  await snapshot('medium-cht05')

  // Fine
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.05, angleTol: 0 })
  await snapshot('fine-cht005')

  // Very fine
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.01, angleTol: 0 })
  await snapshot('veryFine-cht001')

  // Reset
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.1, angleTol: 0, facetingParamsMode: 1 })
  return { partId }
}
