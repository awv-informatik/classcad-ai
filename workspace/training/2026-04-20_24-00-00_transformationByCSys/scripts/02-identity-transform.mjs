export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IdentityTest' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 40, width: 30, height: 20,
    xPosition: 10, yPosition: 5, zPosition: 0,
  })).result

  const refCyl = (await api.v1.part.cylinder({
    id: partId, name: 'RefCyl',
    radius: 5, height: 50,
    xPosition: -25, yPosition: -25, zPosition: 0,
  })).result

  await snapshot('before')

  // Same WCS for both from and to — should be identity (no movement)
  const wcs1 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    offset: [0, 0, 0],
  })).result

  const wcs2 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS2',
    offset: [0, 0, 0],
  })).result

  const r = await api.v1.part.transformationByCSys({
    id: partId,
    name: 'IdentityTransform',
    targets: [boxId],
    references: [wcs1, wcs2],
  })

  console.log('[02] identity result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'identity-response')

  await snapshot('after')
  return { partId }
}
