export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create a WCS offset from origin
  const wcsId = (await api.v1.part.workCSys({
    id: partId, name: 'OffsetWCS',
    origin: [50, 30, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  console.log('[08] wcsId:', wcsId)

  // Create box at origin (no references)
  const boxId = (await api.v1.part.box({ id: partId, name: 'MyBox', length: 60, width: 40, height: 30 })).result
  console.log('[08] boxId:', boxId)

  await snapshot('at-origin')

  // Update to add references — move box to WCS
  await api.v1.part.openFeature({ id: boxId })
  const upR1 = await api.v1.part.updateBox({ id: boxId, references: [wcsId] })
  console.log('[08] add references — result:', upR1.result, 'maxLevel:', upR1.maxLevel)
  filewrite({ result: upR1.result, messages: upR1.messages, maxLevel: upR1.maxLevel }, 'add-ref-response')
  await api.v1.part.closeFeature({ id: boxId })

  await snapshot('at-wcs')

  // Update to remove references — move box back to origin
  await api.v1.part.openFeature({ id: boxId })
  const upR2 = await api.v1.part.updateBox({ id: boxId, references: [] })
  console.log('[08] remove references — result:', upR2.result, 'maxLevel:', upR2.maxLevel)
  filewrite({ result: upR2.result, messages: upR2.messages, maxLevel: upR2.maxLevel }, 'remove-ref-response')
  await api.v1.part.closeFeature({ id: boxId })

  await snapshot('back-to-origin')

  return { partId, boxId, wcsId }
}
