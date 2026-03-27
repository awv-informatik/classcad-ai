// Can you rename a feature via update during open/close?
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'RenameTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'OriginalBox', length: 80, width: 60, height: 40 })).result
  console.log('[14] boxId:', boxId)

  // open → rename via updateBox → close
  await api.v1.part.openFeature({ id: boxId })
  const r = await api.v1.part.updateBox({ id: boxId, name: 'RenamedBox' })
  console.log('[14] updateBox name result:', r.result, 'maxLevel:', r.maxLevel)
  await api.v1.part.closeFeature({ id: boxId })

  return { partId, boxId }
}
