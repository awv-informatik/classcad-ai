// 07 — examine what constraints rectangle auto-generates (H/V on lines, coincident on corners)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConstraintTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const r = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [10, 10, 0],
    endPos: [70, 40, 0],
  })
  console.log('[07] rect IDs:', r.result)

  // Dump the full structure to inspect auto-generated constraints
  const structR = await api.v1.common.getAppVersion({})
  filewrite(structR.structure, 'structure')

  // Try to get geometry info for each line
  for (let i = 0; i < r.result.length; i++) {
    const geo = await api.v1.sketch.getGeometry({ id: r.result[i] })
    console.log(`[07] line[${i}] geometry:`, JSON.stringify(geo.result))
  }

  await snapshot('constraints')
  return { partId }
}
