export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiTarget' })).result

  const wcs1 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [80, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result
  const wcs2 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS2',
    origin: [0, 80, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  const box1 = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Box2', length: 30, width: 30, height: 50, references: [wcs1] })).result
  const box3 = (await api.v1.part.box({ id: partId, name: 'Box3', length: 40, width: 40, height: 20, references: [wcs2] })).result
  console.log('[02] box1:', box1, 'box2:', box2, 'box3:', box3)

  await snapshot('before')

  // Delete box2 AND box3 in a single entityDeletion
  const r = await api.v1.part.entityDeletion({ id: partId, name: 'DelMulti', targets: [box2, box3] })
  console.log('[02] entityDeletion result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'multi-deletion-response')

  await snapshot('after-delete-box2-and-box3')

  return { partId, box1, box2, box3, delId: r.result }
}
