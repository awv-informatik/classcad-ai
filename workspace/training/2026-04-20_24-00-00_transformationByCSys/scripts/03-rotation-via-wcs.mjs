export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RotateCSys' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 50, width: 20, height: 15,
    xPosition: 10, yPosition: 0, zPosition: 0,
  })).result

  const refCyl = (await api.v1.part.cylinder({
    id: partId, name: 'RefCyl',
    radius: 5, height: 60,
    xPosition: -25, yPosition: -25, zPosition: 0,
  })).result

  await snapshot('before')

  // from: origin, no rotation
  const wcsFrom = (await api.v1.part.workCSys({
    id: partId, name: 'WCS_From',
    offset: [0, 0, 0],
    rotation: [0, 0, 0],
  })).result

  // to: same origin, but rotated 90° around Z
  const wcsTo = (await api.v1.part.workCSys({
    id: partId, name: 'WCS_To',
    offset: [0, 0, 0],
    rotation: [0, 0, Math.PI / 2],
  })).result

  const r = await api.v1.part.transformationByCSys({
    id: partId,
    name: 'RotateBy90Z',
    targets: [boxId],
    references: [wcsTo, wcsFrom],
  })

  console.log('[03] rotation result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'rotation-response')

  await snapshot('after')
  return { partId }
}
