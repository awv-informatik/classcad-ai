export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ObjTargets' })).result

  // Create a box — will have one solid
  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 40, width: 30, height: 20,
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
    offset: [50, 30, 20],
  })).result

  // Test object-style targets with explicit indices
  const r = await api.v1.part.transformationByCSys({
    id: partId,
    name: 'ObjStyleTransform',
    targets: [{ id: boxId, indices: [0] }],
    references: [wcsTo, wcsFrom],
  })

  console.log('[06] object targets result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'obj-targets-response')

  await snapshot('after')
  return { partId }
}
