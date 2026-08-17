export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ReversedRef' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 40, width: 30, height: 20,
    xPosition: 60, yPosition: 40, zPosition: 30,
  })).result

  const refCyl = (await api.v1.part.cylinder({
    id: partId, name: 'RefCyl',
    radius: 5, height: 60,
    xPosition: -10, yPosition: -10, zPosition: 0,
  })).result

  await snapshot('before')

  // WCS at [60,40,30] and at origin — reversed order should move box BACK to origin
  const wcsA = (await api.v1.part.workCSys({
    id: partId, name: 'WCS_A',
    offset: [60, 40, 30],
  })).result

  const wcsB = (await api.v1.part.workCSys({
    id: partId, name: 'WCS_B',
    offset: [0, 0, 0],
  })).result

  // references[0] = "to" (origin), references[1] = "from" (where box currently is)
  // Should move box from [60,40,30] to origin
  const r = await api.v1.part.transformationByCSys({
    id: partId,
    name: 'MoveToOrigin',
    targets: [boxId],
    references: [wcsB, wcsA],
  })

  console.log('[07] reversed refs result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'reversed-response')

  await snapshot('after')
  return { partId }
}
