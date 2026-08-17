export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MirrorIntersect' })).result

  // Box centered on the mirror plane — geometry straddles the plane
  const boxId = (await api.v1.part.box({
    id: partId,
    name: 'Box1',
    length: 60,
    width: 40,
    height: 30,
  })).result

  // Right plane is at x=0. Box spans 0-60. Let's mirror across Front (XZ at y=0).
  // Box spans 0-40 in Y. Mirror across y=0 means mirror overlaps original.
  const frontWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Front' })).result
  console.log('[07] boxId:', boxId, 'frontWp:', frontWp)

  await snapshot('before-intersect')

  const r = await api.v1.part.mirror({
    id: partId,
    targets: [boxId],
    references: [frontWp],
  })
  console.log('[07] mirrorId:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[07] messages:', JSON.stringify(r.messages))

  await snapshot('after-intersect')

  return { partId, boxId, mirrorId: r.result }
}
