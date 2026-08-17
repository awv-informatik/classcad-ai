export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExtTest' })).result

  // Create a box as base
  const boxId = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 10 })).result

  // Create a sketch on top for extrusion
  const skId = (await api.v1.part.sketch({ id: partId, name: 'Sk1' })).result
  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [40, 30, 0], radius: 15 })).result
  const regId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: [circId] })).result

  // Create extrusion feature
  const extId = (await api.v1.part.extrusion({
    id: partId,
    name: 'Pillar',
    references: [regId],
    type: 'UP',
    limit2: 50,
  })).result
  console.log('[11] boxId:', boxId, 'extId:', extId)

  await snapshot('before-color')

  // Color extrusion feature
  const r1 = await api.v1.part.setAppearance({ target: extId, color: [255, 128, 0], transparency: 0.2 })
  console.log('[11] extrusion color:', r1.maxLevel)

  // Color box feature differently
  const r2 = await api.v1.part.setAppearance({ target: boxId, color: [0, 128, 255] })
  console.log('[11] box color:', r2.maxLevel)

  await snapshot('after-color')

  filewrite({
    extrusion: { maxLevel: r1.maxLevel, msgs: r1.messages },
    box: { maxLevel: r2.maxLevel, msgs: r2.messages },
  }, 'extrusion-results')

  return { partId }
}
