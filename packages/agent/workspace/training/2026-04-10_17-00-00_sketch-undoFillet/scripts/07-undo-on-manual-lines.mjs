// Test: Does undoFillet work on manually-drawn lines (not from rectangle)?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UndoManualLines' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Draw two connected lines manually (V-shape)
  const l1 = await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 60, 0] })
  const l2 = await api.v1.sketch.line({ id: skId, startPos: [40, 60, 0], endPos: [80, 0, 0] })
  console.log('[07] line1:', l1.result, 'line2:', l2.result)
  await snapshot('two-lines')

  // Fillet where they meet
  const f = await api.v1.sketch.fillet({ id: skId, lineIds: [l1.result, l2.result], radius: 10 })
  console.log('[07] fillet result:', JSON.stringify(f.result), 'maxLevel:', f.maxLevel)

  if (!f.result) {
    console.log('[07] fillet failed! Messages:', JSON.stringify(f.messages))
    filewrite({ filletFailed: true, messages: f.messages }, 'fillet-failed')
    return { partId }
  }

  const [arcId] = f.result
  await snapshot('filleted')

  // Undo
  const u = await api.v1.sketch.undoFillet({ id: skId, arcId })
  console.log('[07] undo result:', u.result, 'maxLevel:', u.maxLevel)
  await snapshot('after-undo')

  const geo = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[07] geo after undo:', JSON.stringify(geo.result))
  filewrite(geo.result, 'geo-after-undo')

  return { partId }
}
