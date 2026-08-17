// Basic openFeature/closeFeature round trip — no changes, just open and close
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'OpenCloseTest' })).result
  console.log('[01] partId:', partId)

  // Create a workPlane feature
  const wpId = (await api.v1.part.workPlane({
    id: partId,
    name: 'WP1',
    position: [0, 0, 50],
    normal: [0, 0, 1],
  })).result
  console.log('[01] wpId:', wpId)

  // Open the feature (no-op round trip)
  const openRes = await api.v1.part.openFeature({ id: wpId })
  console.log('[01] openFeature result:', openRes.result, 'maxLevel:', openRes.maxLevel)

  // Close immediately without changes
  const closeRes = await api.v1.part.closeFeature({ id: wpId })
  console.log('[01] closeFeature result:', closeRes.result, 'maxLevel:', closeRes.maxLevel)

  return { partId, wpId, openRes, closeRes }
}
