export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiTarget' })).result

  const box1 = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 30, width: 20, height: 15,
  })).result

  const box2 = (await api.v1.part.box({
    id: partId, name: 'Box2',
    length: 20, width: 20, height: 40,
    xPosition: 50, yPosition: 0, zPosition: 0,
  })).result

  const refCyl = (await api.v1.part.cylinder({
    id: partId, name: 'RefCyl',
    radius: 5, height: 60,
    xPosition: -30, yPosition: -30, zPosition: 0,
  })).result

  await snapshot('before')

  const wcsFrom = (await api.v1.part.workCSys({
    id: partId, name: 'WCS_From',
    offset: [0, 0, 0],
  })).result

  const wcsTo = (await api.v1.part.workCSys({
    id: partId, name: 'WCS_To',
    offset: [0, 60, 30],
  })).result

  // Transform BOTH boxes
  const r = await api.v1.part.transformationByCSys({
    id: partId,
    name: 'MoveMultiple',
    targets: [box1, box2],
    references: [wcsTo, wcsFrom],
  })

  console.log('[04] multiple targets result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'multi-response')

  await snapshot('after')
  return { partId }
}
