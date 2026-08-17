export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiFeatureTest' })).result

  // Box + extrusion cut through it
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  // Sketch for extrusion on top face
  const skId = (await api.v1.part.sketch({ id: partId, name: 'Sk1' })).result
  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [40, 30, 0], radius: 10 })).result
  const regId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: [circId] })).result

  // Extrusion adds a cylinder on top
  const extId = (await api.v1.part.extrusion({
    id: partId,
    name: 'Ext1',
    references: [regId],
    type: 'UP',
    limit2: 30,
  })).result
  console.log('[19] boxId:', boxId, 'extId:', extId)

  const r = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[19] result:', JSON.stringify(r.result))
  console.log('[19] maxLevel:', r.maxLevel)

  filewrite({ result: r.result, maxLevel: r.maxLevel }, 'multi-features')

  // Box: 80*60*40 = 192000, cog=[40,30,20]
  // Cylinder on top: π*10²*30 = 9424.78, cog=[40,30,55] (40 box height + 30/2 = 55)
  const boxVol = 80 * 60 * 40
  const cylVol = Math.PI * 10 * 10 * 30
  const totalVol = boxVol + cylVol
  const cogZ = (boxVol * 20 + cylVol * 55) / totalVol
  console.log('[19] expected vol:', totalVol.toFixed(2), 'cogZ:', cogZ.toFixed(2))

  await snapshot('multi-features')
  return { partId }
}
