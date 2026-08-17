export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DefaultName' })).result

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

  // No name param — should use default "TransformationByCSys"
  const r = await api.v1.part.transformationByCSys({
    id: partId,
    targets: [boxId],
    references: [wcsTo, wcsFrom],
  })

  console.log('[15] default name result:', r.result, 'maxLevel:', r.maxLevel)

  // Check the name via setObjectName (read the structure to find it)
  filewrite(r.structure, 'structure')

  await snapshot('result')
  return { partId }
}
