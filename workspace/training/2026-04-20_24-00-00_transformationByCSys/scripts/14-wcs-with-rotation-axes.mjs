export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RotAxes' })).result

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

  // from: origin
  const wcsFrom = (await api.v1.part.workCSys({
    id: partId, name: 'WCS_From',
    offset: [0, 0, 0],
    rotation: [0, 0, 0],
  })).result

  // to: rotated around X axis (tilt forward)
  const wcsToX = (await api.v1.part.workCSys({
    id: partId, name: 'WCS_ToX',
    offset: [0, 0, 0],
    rotation: [Math.PI / 4, 0, 0],
  })).result

  const r = await api.v1.part.transformationByCSys({
    id: partId,
    name: 'RotateX45',
    targets: [boxId],
    references: [wcsToX, wcsFrom],
  })

  console.log('[14] X-axis rotation result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'rotX-response')

  await snapshot('after-rotX')
  return { partId }
}
