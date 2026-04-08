// Test: Basic setWorkPlane — reassign sketch from default XY to a custom work plane
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SetWPTest' })).result
  console.log('[01] partId:', partId)

  // Create sketch on default XY plane
  const skR = await api.v1.sketch.create({ id: partId, name: 'Sk1' })
  const skId = skR.result
  console.log('[01] sketchId:', skId)

  // Dump structure to understand its shape
  filewrite(skR.structure, 'structure-after-create')

  // Create a work plane on XZ (normal=[0,1,0]) at y=50
  const wpR = await api.v1.part.workPlane({
    id: partId,
    name: 'XZPlane',
    normal: [0, 1, 0],
    position: [0, 50, 0],
  })
  const wpId = wpR.result
  console.log('[01] workPlaneId:', wpId)

  // Reassign
  const r = await api.v1.sketch.setWorkPlane({ id: skId, planeId: wpId })
  console.log('[01] setWorkPlane result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'setworkplane-response')

  // Dump structure after reassignment
  filewrite(r.structure, 'structure-after-setworkplane')

  return { partId, skId, wpId }
}
