// Test: USERDEFINED workAxis with custom position, direction, and non-normalized vector
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create a box for visual reference
  const skId = (await api.v1.sketch.create({ id: partId })).result
  await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId })).result
  await api.v1.part.extrusion({ id: partId, profile: regionId, direction: [0, 0, 40] })

  // Work axis at custom position, direction along Y
  const r1 = await api.v1.part.workAxis({
    id: partId,
    name: 'WA_Y',
    position: [40, 0, 20],
    direction: [0, 1, 0]
  })
  console.log('[02] WA_Y result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Work axis with non-unit direction vector (check if normalization matters)
  const r2 = await api.v1.part.workAxis({
    id: partId,
    name: 'WA_diag',
    position: [0, 0, 0],
    direction: [10, 10, 10]  // non-normalized
  })
  console.log('[02] WA_diag result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Work axis with zero direction (edge case)
  const r3 = await api.v1.part.workAxis({
    id: partId,
    name: 'WA_zero',
    position: [0, 0, 0],
    direction: [0, 0, 0]
  })
  console.log('[02] WA_zero result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[02] WA_zero messages:', JSON.stringify(r3.messages))

  filewrite({
    wa_y: { result: r1.result, maxLevel: r1.maxLevel },
    wa_diag: { result: r2.result, maxLevel: r2.maxLevel },
    wa_zero: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }
  }, 'responses')

  await snapshot('custom-axes')

  return { partId }
}
