// Test: Inspect the work plane node itself — what does a CC_WorkPlane look like in structure?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'WPInspect' })).result

  const wpR = await api.v1.part.workPlane({
    id: partId, name: 'MyPlane',
    normal: [0, 1, 0], position: [10, 20, 30], offset: 15,
  })
  const wpId = wpR.result
  console.log('[15] wpId:', wpId)

  const wpNode = wpR.structure?.tree?.[''+wpId]
  console.log('[15] wp node:', JSON.stringify(wpNode, null, 2))
  filewrite(wpNode, 'workplane-node')

  // Also check the standard work planes
  const stdPlanes = ['38', '42', '46'].map(id => wpR.structure?.tree?.[id])
  filewrite(stdPlanes, 'std-plane-nodes')
  for (const p of stdPlanes) {
    if (p) console.log('[15] std:', p.id, p.name, 'coordSys:', JSON.stringify(p.coordinateSystem))
  }

  return { partId }
}
