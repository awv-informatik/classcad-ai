// 01 — Default workPlane (only required param: id)
// Question: What does the default look like? Docs say normal=[1,0,0] which is YZ plane
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const r = await api.v1.part.workPlane({ id: partId })
  console.log('[01] result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[01] messages:', JSON.stringify(r.messages))

  // Check what the structure tree says about it
  // Use getWorkGeometry to verify the default name
  const gw = await api.v1.part.getWorkGeometry({ id: partId, name: 'WorkPlane' })
  console.log('[01] getWorkGeometry("WorkPlane"):', gw.result)

  await snapshot('default')
  return { partId, wpId: r.result }
}
