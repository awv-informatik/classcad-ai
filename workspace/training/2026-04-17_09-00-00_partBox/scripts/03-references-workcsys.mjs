export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoxRefTest' })).result

  // Create a work coordinate system offset and rotated
  const wcsId = (await api.v1.part.workCSys({
    id: partId,
    name: 'OffsetCSys',
    origin: [50, 30, 20],
    xDirection: [1, 0, 0],
    yDirection: [0, 1, 0],
  })).result
  console.log('[03] wcsId:', wcsId)

  // Box at origin (no references) for comparison
  const box1 = await api.v1.part.box({ id: partId, name: 'AtOrigin', length: 40, width: 30, height: 20 })
  console.log('[03] box at origin:', box1.result, 'maxLevel:', box1.maxLevel)

  // Box placed at the WCS
  const box2 = await api.v1.part.box({ id: partId, name: 'AtWCS', references: [wcsId], length: 40, width: 30, height: 20 })
  console.log('[03] box at WCS:', box2.result, 'maxLevel:', box2.maxLevel)
  filewrite({ result: box2.result, messages: box2.messages, maxLevel: box2.maxLevel }, 'box-with-refs-response')

  await snapshot('origin-vs-wcs')
  return { partId, wcsId, box1Id: box1.result, box2Id: box2.result }
}
