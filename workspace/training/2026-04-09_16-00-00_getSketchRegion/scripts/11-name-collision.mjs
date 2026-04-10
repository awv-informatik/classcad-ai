// Verify the name collision behavior — names that collide with existing objects get suffixed
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rect1 = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [30, 20, 0] })).result

  // "Right" collides with CC_WorkPlane "Right" => should become "Right0"
  const reg1 = await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect1, name: 'Right' })
  console.log('[11] created "Right" -> id:', reg1.result)

  // Look up by 'Right' (original name) — should fail because stored as 'Right0'
  const r1 = await api.v1.sketch.getSketchRegion({ id: skId, name: 'Right' })
  console.log('[11] lookup "Right":', r1.result, '(expect null)')

  // Look up by 'Right0' (actual stored name) — should succeed
  const r2 = await api.v1.sketch.getSketchRegion({ id: skId, name: 'Right0' })
  console.log('[11] lookup "Right0":', r2.result, 'match:', r2.result === reg1.result)

  // Try other default work plane names: "Top", "Front"
  const rect2 = (await api.v1.sketch.rectangle({ id: skId, startPos: [40, 0, 0], endPos: [70, 20, 0] })).result
  const reg2 = await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect2, name: 'Top' })
  console.log('[11] created "Top" -> id:', reg2.result)

  const r3 = await api.v1.sketch.getSketchRegion({ id: skId, name: 'Top' })
  const r4 = await api.v1.sketch.getSketchRegion({ id: skId, name: 'Top0' })
  console.log('[11] lookup "Top":', r3.result, '| lookup "Top0":', r4.result)

  // Try a name that doesn't collide
  const rect3 = (await api.v1.sketch.rectangle({ id: skId, startPos: [80, 0, 0], endPos: [110, 20, 0] })).result
  const reg3 = await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect3, name: 'UniqueProfile' })
  const r5 = await api.v1.sketch.getSketchRegion({ id: skId, name: 'UniqueProfile' })
  console.log('[11] lookup "UniqueProfile":', r5.result, 'match:', r5.result === reg3.result)

  filewrite({
    rightRegion: { id: reg1.result, lookupRight: r1.result, lookupRight0: r2.result },
    topRegion: { id: reg2.result, lookupTop: r3.result, lookupTop0: r4.result },
    uniqueRegion: { id: reg3.result, lookupResult: r5.result },
  }, 'name-collision')

  return { partId }
}
