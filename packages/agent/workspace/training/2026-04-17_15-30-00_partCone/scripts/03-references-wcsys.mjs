export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConeRefTest' })).result

  const wcsId = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [50, 50, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  // Cone at origin (no references)
  const c1 = await api.v1.part.cone({ id: partId, name: 'AtOrigin', bDiameter: 40, tDiameter: 10, height: 60 })
  // Cone at WCS
  const c2 = await api.v1.part.cone({ id: partId, name: 'AtWCS', references: [wcsId], bDiameter: 40, tDiameter: 10, height: 60 })

  console.log('[03] c1 result:', c1.result, 'maxLevel:', c1.maxLevel)
  console.log('[03] c2 result:', c2.result, 'maxLevel:', c2.maxLevel)
  filewrite({ c1: { result: c1.result, maxLevel: c1.maxLevel, messages: c1.messages }, c2: { result: c2.result, maxLevel: c2.maxLevel, messages: c2.messages } }, 'references-response')

  await snapshot('references')
  return { partId, c1Id: c1.result, c2Id: c2.result }
}
