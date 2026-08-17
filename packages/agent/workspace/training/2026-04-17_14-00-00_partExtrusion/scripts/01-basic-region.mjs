export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExtTest' })).result
  console.log('[01] partId:', partId)

  // Create sketch on default XY plane (omit planeId)
  const skId = (await api.v1.sketch.create({ id: partId })).result
  console.log('[01] sketchId:', skId)

  // Draw a rectangle
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  console.log('[01] rectIds:', rectIds)

  // Create sketch region from rectangle lines
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result
  console.log('[01] regionId:', regionId)

  // Basic extrusion — UP type (default), limit2=60
  const r = await api.v1.part.extrusion({
    id: partId,
    name: 'Ext1',
    references: [regionId],
    type: 'UP',
    limit2: 60,
  })
  console.log('[01] extrusion result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'extrusion-response')

  await snapshot('basic-extrusion')
  return { partId, skId, regionId, extId: r.result }
}
