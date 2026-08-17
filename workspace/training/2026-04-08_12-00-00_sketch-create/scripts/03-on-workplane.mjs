// Test: sketch.create on a custom work plane (XZ plane via normal=[0,1,0])
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchTest' })).result
  console.log('[03] partId:', partId)

  // Create a work plane on XZ (normal = [0,1,0])
  const wpR = await api.v1.part.workPlane({
    id: partId,
    name: 'XZ_Plane',
    normal: [0, 1, 0],
    position: [0, 0, 0],
  })
  const wpId = wpR.result
  console.log('[03] workPlane result:', wpId, 'maxLevel:', wpR.maxLevel)

  // Create sketch on that work plane
  const r = await api.v1.sketch.create({ id: partId, planeId: wpId, name: 'SketchOnXZ' })
  console.log('[03] sketch.create result:', r.result, 'maxLevel:', r.maxLevel)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'on-workplane-response')

  await snapshot('sketch-on-xz')

  return { partId, wpId, sketchId: r.result }
}
