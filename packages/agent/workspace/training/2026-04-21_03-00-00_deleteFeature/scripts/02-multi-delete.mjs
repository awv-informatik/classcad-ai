export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 20, height: 60, position: [50, 0, 0] })).result
  const sphereId = (await api.v1.part.sphere({ id: partId, radius: 25, position: [-50, 0, 0] })).result
  console.log('[02] boxId:', boxId, 'cylId:', cylId, 'sphereId:', sphereId)

  await snapshot('before-3-bodies')

  // Delete all three in one call
  const r = await api.v1.part.deleteFeature({ ids: [boxId, cylId, sphereId] })
  console.log('[02] deleteFeature result:', r.result)
  console.log('[02] maxLevel:', r.maxLevel)
  console.log('[02] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'multi-delete-response')

  await snapshot('after-all-deleted')

  // Verify all are gone
  for (const [name, id] of [['Box', boxId], ['Cylinder', cylId], ['Sphere', sphereId]]) {
    const lookup = await api.v1.part.getFeature({ id: partId, name })
    console.log(`[02] getFeature("${name}") after delete — result:`, lookup.result, 'maxLevel:', lookup.maxLevel)
  }

  return { partId }
}
