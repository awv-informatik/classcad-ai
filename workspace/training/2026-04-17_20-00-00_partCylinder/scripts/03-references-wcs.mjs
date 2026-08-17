export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylRef' })).result

  // Create WCS offset from origin
  const wcsId = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [80, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  console.log('[03] wcsId:', wcsId)

  // Create cylinder at WCS
  const r = await api.v1.part.cylinder({ id: partId, name: 'RefCyl', references: [wcsId], diameter: 50, height: 80 })
  console.log('[03] cylinder result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'wcs-response')

  // Also create a default box at origin as reference body for visual comparison
  await api.v1.part.box({ id: partId, name: 'RefBox', length: 30, width: 30, height: 30 })

  await snapshot('wcs-placed')
  return { partId, cylId: r.result }
}
