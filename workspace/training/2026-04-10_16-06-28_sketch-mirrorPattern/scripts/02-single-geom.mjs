// Mirror a single geometry ID (not a rigid set) — test auto-wrap behavior
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a single circle on the left
  const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [15, 15, 0], radius: 10 })).result
  console.log('[02] circle:', circle)

  // Symmetry line at x=40 (vertical)
  const symLine = (await api.v1.sketch.line({ id: skId, startPos: [40, -10, 0], endPos: [40, 40, 0] })).result

  // Pass single geometry ID as rigidSetId
  const r = await api.v1.sketch.mirrorPattern({ id: skId, rigidSetId: circle, symmetryLineId: symLine })
  console.log('[02] result:', JSON.stringify(r.result))
  console.log('[02] maxLevel:', r.maxLevel)
  console.log('[02] geometry length:', r.result?.geometry?.length)

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'single-geom-response')

  await snapshot('single-geom-mirror')
  return { partId }
}
