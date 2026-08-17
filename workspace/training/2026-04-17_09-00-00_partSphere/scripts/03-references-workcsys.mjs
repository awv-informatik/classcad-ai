export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereTest' })).result

  const wcsId = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [80, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  console.log('[03] wcsId:', wcsId)

  // Sphere at origin for reference
  const s1 = await api.v1.part.sphere({ id: partId, name: 'AtOrigin', radius: 30 })
  console.log('[03] sphere at origin:', s1.result, 'maxLevel:', s1.maxLevel)

  // Sphere placed at WCS
  const s2 = await api.v1.part.sphere({ id: partId, name: 'AtWCS', radius: 30, references: [wcsId] })
  console.log('[03] sphere at WCS:', s2.result, 'maxLevel:', s2.maxLevel)
  filewrite({ atOrigin: { result: s1.result, maxLevel: s1.maxLevel }, atWCS: { result: s2.result, maxLevel: s2.maxLevel, messages: s2.messages } }, 'references-response')

  await snapshot('references')
  return { partId }
}
