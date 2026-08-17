export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateRefTest' })).result

  // Create WCS offset from origin
  const wcsId = (await api.v1.part.workCSys({
    id: partId,
    name: 'OffsetCSys',
    origin: [100, 50, 0],
    xDirection: [1, 0, 0],
    yDirection: [0, 1, 0],
  })).result

  // Create box at origin (no references)
  const refBox = (await api.v1.part.box({ id: partId, name: 'Anchor', length: 20, width: 20, height: 20 })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Target', length: 40, width: 40, height: 40 })).result

  await snapshot('before-add-ref')

  // Update to add references (move to WCS)
  await api.v1.part.openFeature({ id: boxId })
  const ur = await api.v1.part.updateBox({ id: boxId, references: [wcsId] })
  await api.v1.part.closeFeature({ id: boxId })

  console.log('[09] add ref result:', ur.result, 'maxLevel:', ur.maxLevel)
  filewrite({ result: ur.result, messages: ur.messages, maxLevel: ur.maxLevel }, 'add-ref-response')

  await snapshot('after-add-ref')
  return { partId, boxId, wcsId }
}
