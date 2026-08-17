export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RemoveRefTest' })).result

  const wcsId = (await api.v1.part.workCSys({
    id: partId,
    name: 'OffsetCSys',
    origin: [80, 60, 0],
    xDirection: [1, 0, 0],
    yDirection: [0, 1, 0],
  })).result

  const refBox = (await api.v1.part.box({ id: partId, name: 'Anchor', length: 20, width: 20, height: 20 })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Target', references: [wcsId], length: 40, width: 40, height: 40 })).result

  await snapshot('with-ref')

  // Remove references by passing empty array
  await api.v1.part.openFeature({ id: boxId })
  const ur = await api.v1.part.updateBox({ id: boxId, references: [] })
  await api.v1.part.closeFeature({ id: boxId })

  console.log('[15] remove ref result:', ur.result, 'maxLevel:', ur.maxLevel)
  filewrite({ result: ur.result, messages: ur.messages, maxLevel: ur.maxLevel }, 'remove-ref-response')

  await snapshot('after-remove-ref')
  return { partId, boxId }
}
