export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExtrusionTarget' })).result

  // Create a box + extrusion (two separate features with geometry)
  const box = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result

  // Create sketch for extrusion on the top face
  const skId = (await api.v1.part.sketch({ id: partId, name: 'Sk1' })).result
  const circleId = (await api.v1.sketch.circle({ id: skId, centerPos: [30, 20, 0], radius: 10 })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: [circleId] })).result

  const ext = (await api.v1.part.extrusion({
    id: partId, name: 'Cyl1',
    references: [regionId],
    type: 'UP',
    limit2: 50,
  })).result
  console.log('[11] box:', box, 'ext:', ext)

  await snapshot('before-two-features')

  // Delete the extrusion feature only
  const r = await api.v1.part.entityDeletion({ id: partId, name: 'Del1', targets: [ext] })
  console.log('[11] result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'ext-deletion-response')

  await snapshot('after-delete-extrusion')

  return { partId }
}
