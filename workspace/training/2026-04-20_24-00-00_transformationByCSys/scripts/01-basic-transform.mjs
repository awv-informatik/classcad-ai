export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TransformCSys' })).result

  // Create a box at origin
  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 40, width: 30, height: 20,
  })).result

  // Reference body that stays fixed
  const refBoxId = (await api.v1.part.cylinder({
    id: partId, name: 'RefCyl',
    radius: 5, height: 60,
    xPosition: -30, yPosition: -30, zPosition: 0,
  })).result

  await snapshot('before')

  // Create two WCS: from = origin, to = offset
  const wcsFrom = (await api.v1.part.workCSys({
    id: partId, name: 'WCS_From',
    offset: [0, 0, 0],
  })).result
  console.log('[01] wcsFrom:', wcsFrom)

  const wcsTo = (await api.v1.part.workCSys({
    id: partId, name: 'WCS_To',
    offset: [60, 40, 30],
  })).result
  console.log('[01] wcsTo:', wcsTo)

  // Transform the box FROM wcsFrom TO wcsTo
  // references[0] = "to", references[1] = "from"
  const r = await api.v1.part.transformationByCSys({
    id: partId,
    name: 'MoveByCSys',
    targets: [boxId],
    references: [wcsTo, wcsFrom],
  })

  console.log('[01] transformationByCSys result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'transform-response')

  await snapshot('after')

  return { partId }
}
