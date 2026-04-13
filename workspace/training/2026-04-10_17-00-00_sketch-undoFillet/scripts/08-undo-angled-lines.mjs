// Test: undoFillet on non-90° angled lines (acute and obtuse angles)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UndoAngled' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Acute angle (~30°)
  const l1 = await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  const l2 = await api.v1.sketch.line({ id: skId, startPos: [50, 0, 0], endPos: [60, 30, 0] })
  console.log('[08] line1:', l1.result, 'line2:', l2.result)
  await snapshot('before-acute-fillet')

  const f = await api.v1.sketch.fillet({ id: skId, lineIds: [l1.result, l2.result], radius: 8 })
  console.log('[08] acute fillet:', JSON.stringify(f.result), 'maxLevel:', f.maxLevel)

  if (f.result) {
    const [arcId] = f.result
    await snapshot('after-acute-fillet')

    // Get positions after fillet
    const posAfterFillet = await api.v1.sketch.getPositions({ id: skId })
    filewrite(posAfterFillet.result, 'positions-after-fillet')

    const u = await api.v1.sketch.undoFillet({ id: skId, arcId })
    console.log('[08] undo acute fillet: maxLevel=', u.maxLevel)
    await snapshot('after-undo-acute')

    // Get positions after undo
    const posAfterUndo = await api.v1.sketch.getPositions({ id: skId })
    filewrite(posAfterUndo.result, 'positions-after-undo')
  }

  return { partId }
}
