// Test: copy unconstrained geometry with default doCopyConstraints
// If there are no constraints to copy, does result still come back null?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UnconstrCopy' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a line with genFixation=false, genIncidence=false to avoid auto-constraints
  const line1 = (await api.v1.sketch.line({
    id: skId, startPos: [10, 10, 0], endPos: [50, 10, 0],
    genFixation: false, genIncidence: false
  })).result
  console.log('[07] line1:', line1)

  // Copy with default doCopyConstraints (TRUE) — but source has no constraints
  const r = await api.v1.sketch.copyGeometry({
    id: skId,
    geomIds: [line1],
    translation: [0, 30, 0]
  })
  console.log('[07] default result:', r.result, 'maxLevel:', r.maxLevel)

  // Also try doCopyConstraints=false on same unconstrained geometry
  const r2 = await api.v1.sketch.copyGeometry({
    id: skId,
    geomIds: [line1],
    translation: [0, 60, 0],
    doCopyConstraints: false
  })
  console.log('[07] false result:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({ defaultResult: r.result, falseResult: r2.result }, 'comparison')

  await snapshot('result')
  return { partId }
}
