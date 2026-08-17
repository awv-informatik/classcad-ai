// 04 — Single curve (no intersections possible). What does the result look like?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitSingle' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  console.log('[04] circle:', circle)

  const r = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[04] result:', JSON.stringify(r.result))
  console.log('[04] maxLevel:', r.maxLevel)
  console.log('[04] result length:', r.result?.length)

  // Is the returned ID the original circle ID?
  console.log('[04] result[0] === circle?', r.result?.[0] === circle)

  filewrite({ result: r.result, maxLevel: r.maxLevel, originalCircle: circle }, 'single-response')
  filewrite(r.structure, 'single-structure')
  return { partId }
}
