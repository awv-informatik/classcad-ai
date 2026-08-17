export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateRefs' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 40, width: 30, height: 20,
  })).result

  const refCyl = (await api.v1.part.cylinder({
    id: partId, name: 'RefCyl',
    radius: 5, height: 60,
    xPosition: -30, yPosition: -30, zPosition: 0,
  })).result

  const wcsFrom = (await api.v1.part.workCSys({
    id: partId, name: 'WCS_From',
    offset: [0, 0, 0],
  })).result

  const wcsTo1 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS_To1',
    offset: [50, 0, 0],
  })).result

  const wcsTo2 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS_To2',
    offset: [0, 50, 40],
  })).result

  // Initial transform
  const featId = (await api.v1.part.transformationByCSys({
    id: partId,
    name: 'UpdateMe',
    targets: [boxId],
    references: [wcsTo1, wcsFrom],
  })).result

  console.log('[08] initial featId:', featId)
  await snapshot('initial')

  // Update: change references to move to a different location
  const r = await api.v1.part.updateTransformationByCSys({
    id: featId,
    references: [wcsTo2, wcsFrom],
  })

  console.log('[08] update result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'update-refs-response')

  await snapshot('updated')
  return { partId }
}
