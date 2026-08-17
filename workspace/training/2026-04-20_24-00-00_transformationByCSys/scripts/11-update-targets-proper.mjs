export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateTargetsProper' })).result

  const box1 = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 30, width: 20, height: 15,
  })).result

  const box2 = (await api.v1.part.box({
    id: partId, name: 'Box2',
    length: 20, width: 20, height: 35,
    xPosition: 50, yPosition: 0, zPosition: 0,
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

  const wcsTo = (await api.v1.part.workCSys({
    id: partId, name: 'WCS_To',
    offset: [0, 50, 30],
  })).result

  // Initially transform box1 only
  const featId = (await api.v1.part.transformationByCSys({
    id: partId,
    name: 'TargetSwap',
    targets: [box1],
    references: [wcsTo, wcsFrom],
  })).result

  console.log('[11] initial featId:', featId)
  await snapshot('initial-box1-moved')

  // Open, update targets, close
  await api.v1.part.openFeature({ id: featId })

  const r = await api.v1.part.updateTransformationByCSys({
    id: featId,
    targets: [box2],
  })

  console.log('[11] update targets result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'update-targets-response')

  await api.v1.part.closeFeature({ id: featId })

  await snapshot('updated-box2-moved')
  return { partId }
}
