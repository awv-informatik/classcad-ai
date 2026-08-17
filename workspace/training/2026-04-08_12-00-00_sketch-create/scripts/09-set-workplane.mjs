// Test: sketch.setWorkPlane — reassign sketch to different plane
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchTest' })).result

  // Create a sketch on default plane
  const skId = (await api.v1.sketch.create({ id: partId, name: 'MovableSketch' })).result
  console.log('[09] sketch created:', skId)

  // Create a work plane on YZ (normal=[1,0,0] is default, let's use XZ)
  const wpId = (await api.v1.part.workPlane({
    id: partId,
    name: 'TargetPlane',
    normal: [0, 1, 0],
    position: [0, 50, 0],
  })).result
  console.log('[09] workPlane created:', wpId)

  // Reassign the sketch
  const r = await api.v1.sketch.setWorkPlane({ id: skId, planeId: wpId })
  console.log('[09] setWorkPlane result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[09] messages:', JSON.stringify(r.messages))

  filewrite({
    result: r.result,
    maxLevel: r.maxLevel,
    messages: r.messages,
  }, 'set-workplane-response')

  await snapshot('after-set-workplane')

  return { partId, skId, wpId }
}
