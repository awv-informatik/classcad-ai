export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PlaneTest' })).result

  // Get Front plane (XZ plane, normal=[0,1,0])
  const frontId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Front' })).result
  console.log('[11] frontId:', frontId)

  // Create sketch on Front plane
  const sk = (await api.v1.sketch.create({ id: partId, planeId: frontId })).result
  console.log('[11] sketchId:', sk)

  // Rectangle on XZ plane (Y is the normal, so coords are in X and Z)
  const lines = (await api.v1.sketch.rectangle({ id: sk, startPos: [0, 0, 0], endPos: [60, 40, 0] })).result
  console.log('[11] lines:', lines)

  const region = (await api.v1.sketch.sketchRegion({ id: sk, geomIds: lines })).result
  console.log('[11] region:', region)

  // UP extrusion — should extrude along the sketch normal (Y direction)
  const e = await api.v1.part.extrusion({
    id: partId, name: 'FrontExt', references: [region], type: 'UP', limit2: 50
  })
  console.log('[11] extrusion:', e.result, 'maxLevel:', e.maxLevel)
  if (e.messages?.length) console.log('[11] msg:', e.messages[0].message)
  filewrite({ result: e.result, messages: e.messages, maxLevel: e.maxLevel }, 'front-plane')

  await snapshot('front-plane-extrusion')
  return { partId }
}
