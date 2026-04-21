export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateName' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 40, width: 30, height: 20,
  })).result

  const wcsFrom = (await api.v1.part.workCSys({
    id: partId, name: 'WCS_From',
    offset: [0, 0, 0],
  })).result

  const wcsTo = (await api.v1.part.workCSys({
    id: partId, name: 'WCS_To',
    offset: [30, 20, 10],
  })).result

  const featId = (await api.v1.part.transformationByCSys({
    id: partId,
    name: 'OriginalName',
    targets: [boxId],
    references: [wcsTo, wcsFrom],
  })).result

  console.log('[12] featId:', featId)

  // Open, update name only, close
  await api.v1.part.openFeature({ id: featId })

  const r = await api.v1.part.updateTransformationByCSys({
    id: featId,
    name: 'RenamedTransform',
  })

  console.log('[12] update name result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'update-name-response')

  await api.v1.part.closeFeature({ id: featId })

  // Verify name by dumping structure
  const structR = await api.v1.common.getObjectName({ id: featId })
  console.log('[12] name after update:', structR.result)
  filewrite({ name: structR.result }, 'name-check')

  return { partId }
}
