// 06 — deleteObject for circles
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeleteTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 15 })).result
  const c2 = (await api.v1.sketch.circle({ id: skId, centerPos: [40, 0, 0], radius: 10 })).result
  console.log('[06] circles:', c1, c2)

  await snapshot('before-delete')

  // Delete first circle
  const r = await api.v1.sketch.deleteObject({ ids: [c1] })
  console.log('[06] delete result:', r.result, 'maxLevel:', r.maxLevel)

  // Verify deleted circle is gone
  const pts = await api.v1.sketch.getPoints({ id: c1 })
  console.log('[06] getPoints deleted:', JSON.stringify(pts.result), 'maxLevel:', pts.maxLevel)

  // Verify second circle unaffected
  const pts2 = await api.v1.sketch.getPoints({ id: c2 })
  console.log('[06] getPoints remaining:', JSON.stringify(pts2.result))

  // getGeometry should only show c2
  const geo = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[06] getGeometry after delete:', JSON.stringify(geo.result))

  await snapshot('after-delete')
  return { partId }
}
