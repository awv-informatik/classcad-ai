export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExtTest' })).result

  // Create a sketch-based extrusion
  const skId = (await api.v1.part.sketch({ id: partId, name: 'Sk1' })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [50, 30, 0] })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  const extId = (await api.v1.part.extrusion({
    id: partId,
    name: 'Ext1',
    references: [regionId],
    type: 'UP',
    limit2: 40,
  })).result
  console.log('[11] extId:', extId)

  // Mass props of part with extrusion
  const r = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[11] result:', JSON.stringify(r.result))
  console.log('[11] maxLevel:', r.maxLevel)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'extrusion-mass')

  // Expected: 50*30*40 = 60000 mm³, COG = [25, 15, 20]
  console.log('[11] expectedVol:', 60000)
  console.log('[11] expectedCog: [25, 15, 20]')

  // Try feature ID (extrusion)
  const rFeat = await api.v1.part.calculateMassProperties({ id: extId })
  console.log('[11] feature result:', JSON.stringify(rFeat.result))
  console.log('[11] feature maxLevel:', rFeat.maxLevel)

  await snapshot('extrusion')
  return { partId }
}
