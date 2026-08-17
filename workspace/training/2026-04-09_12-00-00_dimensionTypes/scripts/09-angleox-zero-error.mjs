// Investigate ANGLEOX at 0° error, and test reversed line directions
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Horizontal line (0°)
  const line0 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [100, 0, 0] })).result
  console.log('[09] horizontal line:', line0)

  // ANGLEOX on horizontal line
  const r1 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLEOX', geomIds: [line0], name: 'aox-0' })
  console.log('[09] ANGLEOX 0°:', r1.result, 'maxLevel=', r1.maxLevel)
  if (r1.messages) console.log('[09] messages:', JSON.stringify(r1.messages))

  // Very small angle line (~1°)
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 10, 0], endPos: [100, 11.75, 0] })).result // ~1°
  const r2 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLEOX', geomIds: [line1], name: 'aox-1deg' })
  console.log('[09] ANGLEOX ~1°:', r2.result, 'maxLevel=', r2.maxLevel)

  // Reversed horizontal line (180° or 0°?)
  const line180 = (await api.v1.sketch.line({ id: skId, startPos: [100, 20, 0], endPos: [0, 20, 0] })).result
  const r3 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLEOX', geomIds: [line180], name: 'aox-reversed' })
  console.log('[09] ANGLEOX reversed horiz:', r3.result, 'maxLevel=', r3.maxLevel)

  // Line pointing down (-90° or 270°?)
  const lineDown = (await api.v1.sketch.line({ id: skId, startPos: [0, 60, 0], endPos: [0, 10, 0] })).result
  const r4 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLEOX', geomIds: [lineDown], name: 'aox-down' })
  console.log('[09] ANGLEOX down:', r4.result, 'maxLevel=', r4.maxLevel)

  // Extract ANGLEOX 0° error details
  if (r1.maxLevel > 31) {
    filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'aox-0-error')
  }

  await snapshot('angleox-edge')
  return { partId }
}
